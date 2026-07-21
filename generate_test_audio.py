import wave
import struct
import math

def create_tone(filename, freq, duration, volume=0.5):
    sample_rate = 44100
    num_samples = int(sample_rate * duration)
    
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        
        for i in range(num_samples):
            value = int(volume * 32767.0 * math.sin(2.0 * math.pi * freq * i / sample_rate))
            data = struct.pack('<h', value)
            f.writeframesraw(data)

create_tone('test_song_1_bass.wav', 110.0, 2.0)
create_tone('test_song_2_mid.wav', 440.0, 2.0)
create_tone('test_song_3_high.wav', 880.0, 2.0)
print("Created 3 test .wav files.")
