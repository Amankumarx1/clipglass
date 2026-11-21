import urllib.request
import json
import time

url = 'https://www.youtube.com/watch?v=ORO2j8ja2wA'
print('=== TESTING AUTO CLIP ON TRIGGERED INSAAN VIDEO ===')
print('Video URL:', url)

# 1. Create Auto Clip Job
req_data = json.dumps({
    'url': url,
    'minLength': 20,
    'maxLength': 45,
    'clipCount': 3,
    'reframeMode': 'follow-face',
    'captionPreset': 'viral_pop',
    'consent': True
}).encode()

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/clip/jobs',
    data=req_data,
    headers={'Content-Type': 'application/json'}
)

try:
    res = urllib.request.urlopen(req)
    res_json = json.loads(res.read().decode())
    job_id = res_json['jobId']
    print(f'Job Created Successfully! Job ID: {job_id}')
except Exception as e:
    print('Failed to create job:', e)
    exit(1)

# 2. Poll progress until ready or failed
last_stage = ''
for i in range(120): # up to 4 minutes
    time.sleep(2)
    try:
        check_res = urllib.request.urlopen(f'http://127.0.0.1:8000/api/clip/jobs/{job_id}/clips')
        data = json.loads(check_res.read().decode())
        stage = data.get('stage')
        clips = data.get('clips', [])
        if stage != last_stage:
            print(f'Stage Update -> [{stage.upper()}] (Found {len(clips)} candidate clips)')
            last_stage = stage

        if stage == 'ready':
            print('\n=== AUTO CLIP PIPELINE COMPLETE ===')
            for idx, c in enumerate(clips):
                print(f"\n--- Clip #{idx+1} [Score: {c['score']}/100] ---")
                print(f"Title: {c['title']}")
                print(f"Hook: {c['hook']}")
                print(f"Timing: {c['start']}s - {c['end']}s ({c['duration']}s)")
                print(f"Hashtags: {' '.join(c['hashtags'])}")
                print(f"Reason: {c['reason']}")
                sample_txt = c.get('transcriptText', '') or ''
                print(f"Transcript Sample: {sample_txt[:120]}...")

            # 3. Test rendering the top ranked clip
            top_clip_id = clips[0]['clipId']
            print(f"\nRendering top clip ({top_clip_id}) to 9:16 with burned ASS captions...")
            render_req = urllib.request.Request(
                f'http://127.0.0.1:8000/api/clip/jobs/{job_id}/clips/{top_clip_id}/render',
                data=b'{}',
                headers={'Content-Type': 'application/json'}
            )
            render_res = urllib.request.urlopen(render_req)
            render_json = json.loads(render_res.read().decode())
            print('Render Success:', render_json.get('message'))
            print('Video URL:', render_json.get('clip', {}).get('videoUrl'))
            break
        elif stage == 'failed':
            print('Job reported failed state:', data.get('error'))
            break
    except Exception as e:
        print('Polling error:', e)
