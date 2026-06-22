/**
 * SoundEngine - Moteur sonore procédural de classe mondiale
 * Pour "La Bataille des Étoiles" (DOSCO)
 * 
 * Design sonore :
 * - Ambiance cosmique subtile et évolutive (drone + shimmer stellaire)
 * - Sons de placement d'étoiles cristallins et élégants
 * - Whooshes gravitationnels doux pour les mouvements
 * - Résolutions harmonieuses pour les captures et victoires
 * - Zéro asset externe : 100% Web Audio API (léger, instantané, mobile-friendly)
 * - Optimisé Android / iOS via Capacitor
 * - Déclenchement sécurisé (unlock sur geste utilisateur)
 * 
 * Intégration React :
 *   import SoundEngine from './SoundEngine';
 *   const sound = new SoundEngine();
 *   sound.init();
 *   // Sur premier clic/touch dans le jeu :
 *   sound.unlock();
 *   // Exemples d'appels :
 *   sound.playPlaceStar();
 *   sound.playMove();
 *   sound.playCapture();
 *   sound.playVictory();
 */

class SoundEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.isMuted = false;
    this.ambientNodes = null;
    this.initialized = false;
  }

  /**
   * Initialise le moteur audio (appeler une seule fois au montage du jeu)
   */
  init() {
    if (this.initialized) return;
    
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('[DOSCO Sound] Web Audio API non supportée sur cet appareil');
        return;
      }

      this.audioContext = new AudioContextClass();
      
      // Chaîne master avec compresseur doux pour qualité professionnelle
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.75;

      const compressor = this.audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      this.masterGain.connect(compressor);
      compressor.connect(this.audioContext.destination);

      // Bus SFX
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.masterGain);

      // Bus Ambiance (très discret)
      this.ambientGain = this.audioContext.createGain();
      this.ambientGain.gain.value = 0.12;
      this.ambientGain.connect(this.masterGain);

      this.initialized = true;
      console.log('[DOSCO Sound] Moteur sonore initialisé avec succès');
    } catch (e) {
      console.error('[DOSCO Sound] Erreur initialisation audio:', e);
    }
  }

  /**
   * Déverrouille le contexte audio (obligatoire sur iOS Safari et certains Android)
   * À appeler sur le premier geste utilisateur (clic, touch, etc.)
   */
  unlock() {
    if (!this.audioContext) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('[DOSCO Sound] Contexte audio déverrouillé');
        if (!this.ambientNodes) {
          this.startAmbient();
        }
      }).catch(console.warn);
    } else if (!this.ambientNodes) {
      this.startAmbient();
    }
  }

  /**
   * Active/désactive le son global
   */
  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0.001 : 0.75;
    }
  }

  /**
   * Ambiance cosmique de fond - Drone + Shimmer stellaire évolutif
   * Très discret, non fatigant, parfait pour sessions longues
   */
  startAmbient() {
    if (!this.audioContext || this.ambientNodes || this.isMuted) return;

    const now = this.audioContext.currentTime;
    const nodes = {};

    // === DRONE GRAVITATIONNEL TRÈS BAS (espace profond) ===
    const droneOsc = this.audioContext.createOscillator();
    droneOsc.type = 'sine';
    droneOsc.frequency.value = 36.7; // très grave, presque infrason

    const droneFilter = this.audioContext.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 95;

    const droneGain = this.audioContext.createGain();
    droneGain.gain.value = 0.0; // on va le monter doucement

    // Modulation très lente du drone (évolution organique)
    const droneLFO = this.audioContext.createOscillator();
    droneLFO.type = 'sine';
    droneLFO.frequency.value = 0.018; // ultra lent (~55 secondes par cycle)

    const droneLFOGain = this.audioContext.createGain();
    droneLFOGain.gain.value = 4.5;

    droneLFO.connect(droneLFOGain);
    droneLFOGain.connect(droneOsc.frequency);

    // === SHIMMER / POUSSIÈRE D'ÉTOILES (haute fréquence cristalline) ===
    const shimmerOsc = this.audioContext.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.value = 1180;

    const shimmerFilter = this.audioContext.createBiquadFilter();
    shimmerFilter.type = 'bandpass';
    shimmerFilter.frequency.value = 2650;
    shimmerFilter.Q.value = 6.5;

    const shimmerGain = this.audioContext.createGain();
    shimmerGain.gain.value = 0.0;

    // LFO léger sur le shimmer pour scintillement naturel
    const shimmerLFO = this.audioContext.createOscillator();
    shimmerLFO.type = 'sine';
    shimmerLFO.frequency.value = 0.11;

    const shimmerLFOGain = this.audioContext.createGain();
    shimmerLFOGain.gain.value = 18;

    shimmerLFO.connect(shimmerLFOGain);
    shimmerLFOGain.connect(shimmerOsc.frequency);

    // === TEXTURE LÉGÈRE (bruit filtré) ===
    const noise = this._createNoiseSource();
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 620;
    noiseFilter.Q.value = 3.8;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.008;

    // Mixage ambiance
    const ambientMix = this.audioContext.createGain();

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(ambientMix);

    shimmerOsc.connect(shimmerFilter);
    shimmerFilter.connect(shimmerGain);
    shimmerGain.connect(ambientMix);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ambientMix);

    ambientMix.connect(this.ambientGain);

    // Démarrage progressif (fade-in élégant sur 4 secondes)
    const fadeInTime = now + 4.0;
    droneGain.gain.setValueAtTime(0.0001, now);
    droneGain.gain.linearRampToValueAtTime(0.065, fadeInTime);

    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.linearRampToValueAtTime(0.018, fadeInTime + 1.5);

    // Lancement des oscillateurs
    droneOsc.start(now);
    shimmerOsc.start(now);
    droneLFO.start(now);
    shimmerLFO.start(now);
    noise.start(now);

    // Stocker les nodes pour pouvoir arrêter plus tard si besoin
    nodes.droneOsc = droneOsc;
    nodes.shimmerOsc = shimmerOsc;
    nodes.droneLFO = droneLFO;
    nodes.shimmerLFO = shimmerLFO;
    nodes.noise = noise;
    nodes.droneGain = droneGain;
    nodes.shimmerGain = shimmerGain;
    nodes.stop = () => {
      const t = this.audioContext.currentTime;
      droneGain.gain.linearRampToValueAtTime(0.0001, t + 2.2);
      shimmerGain.gain.linearRampToValueAtTime(0.0001, t + 2.2);
      setTimeout(() => {
        try {
          droneOsc.stop();
          shimmerOsc.stop();
          droneLFO.stop();
          shimmerLFO.stop();
          noise.stop();
        } catch (_) {}
      }, 2400);
    };

    this.ambientNodes = nodes;
    console.log('[DOSCO Sound] Ambiance cosmique démarrée');
  }

  _createNoiseSource() {
    const bufferSize = this.audioContext.sampleRate * 6;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
  }

  /**
   * Son de placement d'une étoile - Cristallin, élégant, signature du jeu
   */
  playPlaceStar() {
    if (!this.audioContext || this.isMuted) return;
    this.unlock();

    const now = this.audioContext.currentTime;
    const duration = 2.1;

    // Ton principal - Note cristalline (A5 + E6)
    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 880; // A5

    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1320; // E6 (quinte parfaite)

    // Envelope douce
    const gain = this.audioContext.createGain();
    gain.gain.value = 0;

    // Filtre doux pour chaleur
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;

    // Réverbération simulée légère (delay + feedback)
    const delay = this.audioContext.createDelay(1.2);
    delay.delayTime.value = 0.31;

    const feedback = this.audioContext.createGain();
    feedback.gain.value = 0.18;

    const reverbSend = this.audioContext.createGain();
    reverbSend.gain.value = 0.38;

    // Connexions
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    // Chemin réverb
    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(reverbSend);
    reverbSend.connect(this.sfxGain);

    // Envelope musicale (attaque douce + decay long)
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.012);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.15);
    osc2.stop(now + duration + 0.15);

    // Ajout d'un "scintillement" haute fréquence (signature étoile)
    setTimeout(() => {
      if (!this.audioContext || this.isMuted) return;
      const t = this.audioContext.currentTime;

      const sparkle = this.audioContext.createOscillator();
      sparkle.type = 'sine';
      sparkle.frequency.value = 1975; // G#6 / La bémol

      const sparkleGain = this.audioContext.createGain();
      sparkleGain.gain.value = 0.0;

      const sparkleFilter = this.audioContext.createBiquadFilter();
      sparkleFilter.type = 'highpass';
      sparkleFilter.frequency.value = 1350;

      sparkle.connect(sparkleFilter);
      sparkleFilter.connect(sparkleGain);
      sparkleGain.connect(this.sfxGain);

      sparkleGain.gain.setValueAtTime(0.0001, t);
      sparkleGain.gain.linearRampToValueAtTime(0.14, t + 0.008);
      sparkleGain.gain.linearRampToValueAtTime(0.0001, t + 1.35);

      sparkle.start(t);
      sparkle.stop(t + 1.5);
    }, 165);
  }

  /**
   * Son de mouvement / glissement d'étoile (whoosh gravitationnel doux)
   */
  playMove() {
    if (!this.audioContext || this.isMuted) return;
    this.unlock();

    const now = this.audioContext.currentTime;

    // Bruit filtré en mouvement
    const noise = this._createNoiseSource();
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 2.8;

    const gain = this.audioContext.createGain();
    gain.gain.value = 0.0;

    // Pitch bend doux pour sensation de déplacement
    const pitchLFO = this.audioContext.createOscillator();
    pitchLFO.type = 'sine';
    pitchLFO.frequency.value = 0.8;

    const pitchLFOGain = this.audioContext.createGain();
    pitchLFOGain.gain.value = 85;

    pitchLFO.connect(pitchLFOGain);
    pitchLFOGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    // Envelope courte et douce
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.025);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.85);

    noise.start(now);
    pitchLFO.start(now);

    noise.stop(now + 1.0);
    pitchLFO.stop(now + 1.0);
  }

  /**
   * Son de capture / résolution de bataille - Tension douce puis résolution harmonieuse
   */
  playCapture() {
    if (!this.audioContext || this.isMuted) return;
    this.unlock();

    const now = this.audioContext.currentTime;

    // Petit cluster dissonant bref (tension)
    const cluster = [740, 785, 832];
    cluster.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = this.audioContext.createGain();
      g.gain.value = 0.0;

      osc.connect(g);
      g.connect(this.sfxGain);

      const start = now + i * 0.012;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.18, start + 0.04);
      g.gain.linearRampToValueAtTime(0.0001, start + 0.38);

      osc.start(start);
      osc.stop(start + 0.45);
    });

    // Résolution harmonieuse (tierce majeure douce)
    setTimeout(() => {
      if (!this.audioContext || this.isMuted) return;
      const t = this.audioContext.currentTime;

      const resolve1 = this.audioContext.createOscillator();
      resolve1.type = 'sine';
      resolve1.frequency.value = 660; // E5

      const resolve2 = this.audioContext.createOscillator();
      resolve2.type = 'sine';
      resolve2.frequency.value = 880; // A5

      const rg = this.audioContext.createGain();
      rg.gain.value = 0.0;

      resolve1.connect(rg);
      resolve2.connect(rg);
      rg.connect(this.sfxGain);

      rg.gain.setValueAtTime(0.0001, t);
      rg.gain.linearRampToValueAtTime(0.32, t + 0.02);
      rg.gain.linearRampToValueAtTime(0.0001, t + 1.6);

      resolve1.start(t);
      resolve2.start(t);
      resolve1.stop(t + 1.7);
      resolve2.stop(t + 1.7);
    }, 420);
  }

  /**
   * Son de victoire - Ascending ethereal (très beau et émouvant)
   */
  playVictory() {
    if (!this.audioContext || this.isMuted) return;
    this.unlock();

    const now = this.audioContext.currentTime;
    const notes = [880, 1046.5, 1318.5, 1760]; // A5 → C6 → E6 → A6

    notes.forEach((freq, index) => {
      const delay = index * 0.28;
      const startTime = now + delay;

      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.audioContext.createGain();
      gain.gain.value = 0.0;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2800;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      // Envelope douce avec sustain léger
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.42, startTime + 0.035);
      gain.gain.linearRampToValueAtTime(0.0001, startTime + 2.8 + (index * 0.15));

      osc.start(startTime);
      osc.stop(startTime + 3.2);
    });

    // Ajout d'un shimmer final très doux
    setTimeout(() => {
      if (!this.audioContext || this.isMuted) return;
      const t = this.audioContext.currentTime;

      const finalShimmer = this.audioContext.createOscillator();
      finalShimmer.type = 'sine';
      finalShimmer.frequency.value = 2480;

      const fg = this.audioContext.createGain();
      fg.gain.value = 0.0;

      finalShimmer.connect(fg);
      fg.connect(this.sfxGain);

      fg.gain.setValueAtTime(0.0001, t);
      fg.gain.linearRampToValueAtTime(0.09, t + 0.6);
      fg.gain.linearRampToValueAtTime(0.0001, t + 4.5);

      finalShimmer.start(t);
      finalShimmer.stop(t + 4.8);
    }, 950);
  }

  /**
   * Son de défaite / fin de partie (sobre, élégant, pas dramatique)
   */
  playDefeat() {
    if (!this.audioContext || this.isMuted) return;
    this.unlock();

    const now = this.audioContext.currentTime;

    // Descente douce et contemplative
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 740;

    const gain = this.audioContext.createGain();
    gain.gain.value = 0.0;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1600;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
    gain.gain.linearRampToValueAtTime(0.0001, now + 2.4);

    // Légère descente de pitch
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.linearRampToValueAtTime(520, now + 2.2);

    osc.start(now);
    osc.stop(now + 2.6);
  }

  /**
   * Son UI générique (sélection, hover, bouton)
   */
  playUISelect() {
    if (!this.audioContext || this.isMuted) return;
    this.unlock();

    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1240;

    const gain = this.audioContext.createGain();
    gain.gain.value = 0.0;

    osc.connect(gain);
    gain.connect(this.sfxGain);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.006);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.32);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Arrête l'ambiance (si besoin de libérer ressources)
   */
  stopAmbient() {
    if (this.ambientNodes && this.ambientNodes.stop) {
      this.ambientNodes.stop();
      this.ambientNodes = null;
    }
  }

  /**
   * Nettoyage complet
   */
  dispose() {
    this.stopAmbient();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.initialized = false;
  }
}

// Export pour usage module ou global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundEngine;
}
if (typeof window !== 'undefined') {
  window.DOSCOSoundEngine = SoundEngine;
}

export default SoundEngine;
