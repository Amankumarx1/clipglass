import os
import subprocess

styles = {
    'caption_news': {
        'intro_v': 'color=c=0x111111:s=1080x1920:d=3,drawbox=y=ih*0.45:h=180:color=0xFFE600:t=fill,drawbox=y=ih*0.43:h=20:color=0xFF3333:t=fill,drawbox=y=ih*0.55:h=15:color=0xFF3333:t=fill',
        'outro_v': 'color=c=0x111111:s=1080x1920:d=3,drawbox=y=ih*0.45:h=140:color=0xFFE600:t=fill',
        'freq': 880
    },
    'swiss_motion': {
        'intro_v': 'color=c=0xFAFAFA:s=1080x1920:d=3,drawbox=x=80:y=ih*0.4:w=920:h=6:color=0xFF4400:t=fill,drawbox=x=80:y=ih*0.43:w=920:h=200:color=0x0A0A0A:t=fill',
        'outro_v': 'color=c=0xFAFAFA:s=1080x1920:d=3,drawbox=x=80:y=ih*0.45:w=920:h=6:color=0xFF4400:t=fill',
        'freq': 523
    },
    'neon_tubes': {
        'intro_v': 'color=c=0x050510:s=1080x1920:d=3,drawbox=x=60:y=ih*0.35:w=960:h=8:color=0x00F0FF:t=fill,drawbox=x=60:y=ih*0.55:w=960:h=8:color=0xFF0077:t=fill',
        'outro_v': 'color=c=0x050510:s=1080x1920:d=3,drawbox=x=60:y=ih*0.45:w=960:h=8:color=0x00F0FF:t=fill',
        'freq': 659
    },
    'dark_tech': {
        'intro_v': 'color=c=0x0F172A:s=1080x1920:d=3,drawbox=x=60:y=ih*0.4:w=960:h=4:color=0x38BDF8:t=fill,drawbox=x=60:y=ih*0.42:w=960:h=180:color=0x1E293B:t=fill,drawbox=x=60:y=ih*0.52:w=960:h=6:color=0x8B5CF6:t=fill',
        'outro_v': 'color=c=0x0F172A:s=1080x1920:d=3,drawbox=x=60:y=ih*0.45:w=960:h=6:color=0x8B5CF6:t=fill',
        'freq': 440
    }
}

base_dir = os.path.dirname(os.path.abspath(__file__))

for style_name, conf in styles.items():
    s_dir = os.path.join(base_dir, style_name)
    os.makedirs(s_dir, exist_ok=True)
    intro_mp4 = os.path.join(s_dir, 'intro_sting.mp4')
    outro_mp4 = os.path.join(s_dir, 'outro_sting.mp4')
    
    freq = conf['freq']
    
    # Render Intro
    cmd_i = [
        'ffmpeg', '-y',
        '-f', 'lavfi', '-i', conf['intro_v'],
        '-f', 'lavfi', '-i', f'sine=f={freq}:d=0.2,apad=whole_dur=3',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-shortest',
        intro_mp4
    ]
    subprocess.run(cmd_i, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Render Outro
    cmd_o = [
        'ffmpeg', '-y',
        '-f', 'lavfi', '-i', conf['outro_v'],
        '-f', 'lavfi', '-i', f'sine=f={freq // 2}:d=0.2,apad=whole_dur=3',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-shortest',
        outro_mp4
    ]
    subprocess.run(cmd_o, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f'Generated assets for: {style_name}')

print('All polish pack stings successfully rendered.')
