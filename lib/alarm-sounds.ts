import * as Tone from 'tone';

export const AlarmSounds = {
  default: async () => {
    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    const pattern = [
      ['C5', 'E5', 'G5'], ['C5', 'E5', 'G5'],
      ['D5', 'F5', 'A5'], ['D5', 'F5', 'A5'],
    ];
    let i = 0;
    const loop = new Tone.Loop(time => {
      synth.triggerAttackRelease(pattern[i % pattern.length], '8n', time, 0.4);
      i++;
      if (i >= 12) { loop.stop(); synth.dispose(); }
    }, '4n');
    Tone.Transport.start();
    loop.start();
  },

  gentle: async () => {
    await Tone.start();
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 0.1, sustain: 0.8, release: 1.5 }
    }).toDestination();
    // Soft ascending arpeggio, repeats 3 times
    const notes = ['C4', 'E4', 'G4', 'C5'];
    notes.forEach((note, i) => {
      synth.triggerAttackRelease(note, '4n', `+${i * 0.5}`);
    });
    setTimeout(() => {
      notes.forEach((note, i) => {
        synth.triggerAttackRelease(note, '4n', Tone.now() + i * 0.5);
      });
      setTimeout(() => synth.dispose(), 4000);
    }, 2500);
  },

  urgent: async () => {
    await Tone.start();
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 4,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }
    }).toDestination();
    // Rapid urgent beeps
    const times = [0, 0.3, 0.6, 1.0, 1.3, 1.6, 2.2, 2.5, 2.8];
    times.forEach(t => synth.triggerAttackRelease('C2', '8n', `+${t}`, 0.7));
    setTimeout(() => synth.dispose(), 4000);
  },

  loud: async () => {
    await Tone.start();
    const osc = new Tone.Oscillator('A4', 'sawtooth').toDestination();
    const env = new Tone.AmplitudeEnvelope({
      attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3
    }).toDestination();
    osc.connect(env);
    // Classic alarm pattern: two-tone alternating
    let on = true;
    const interval = setInterval(() => {
      osc.frequency.value = on ? 880 : 660;
      on = !on;
    }, 400);
    osc.start(); env.triggerAttack();
    setTimeout(() => {
      clearInterval(interval);
      env.triggerRelease();
      setTimeout(() => { osc.stop(); osc.dispose(); env.dispose(); }, 500);
    }, 5000);
  }
};
