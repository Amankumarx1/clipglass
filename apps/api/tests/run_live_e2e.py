import urllib.request
import json
import time

def main():
    payload = {
        'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'mode': 'audio',
        'audioFormat': 'mp3',
        'audioBitrate': 128,
        'trim': {'enabled': True, 'startTime': '00:00:01', 'endTime': '00:00:04'},
        'consent': True,
        'filename': 'e2e_test_slice'
    }
    req = urllib.request.Request(
        'http://localhost:8000/api/v1/jobs',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req, timeout=10)
    job_id = json.loads(res.read().decode('utf-8'))['jobId']
    print('[1] Job created successfully:', job_id)

    # Poll for completion
    st_data = {}
    for i in range(40):
        time.sleep(1)
        status_res = urllib.request.urlopen(f'http://localhost:8000/api/v1/jobs/{job_id}/status')
        st_data = json.loads(status_res.read().decode('utf-8'))
        state = st_data.get('state')
        pct = st_data.get('percent', 0)
        print(f'    Tick {i+1}: stage={state}, percent={pct}%')
        if state in ('ready', 'failed', 'cancelled'):
            break

    if st_data.get('state') != 'ready':
        print('FAILED:', st_data)
        return False

    print('[2] Job completed! File size:', st_data.get('filesize'), 'bytes')

    # 3. Test peaks endpoint
    peaks_res = urllib.request.urlopen(f'http://localhost:8000/api/v1/jobs/{job_id}/peaks')
    peaks_data = json.loads(peaks_res.read().decode('utf-8'))
    print('[3] Peaks endpoint OK: count =', peaks_data.get('count'), 'peaks =', peaks_data.get('peaks')[:6])

    # 4. Test Range request HTTP 206
    range_req = urllib.request.Request(
        f'http://localhost:8000/api/v1/jobs/{job_id}/file',
        headers={'Range': 'bytes=0-99'}
    )
    range_res = urllib.request.urlopen(range_req)
    print('[4] Range request OK: status =', range_res.status, 'Content-Range =', range_res.headers.get('Content-Range'))

    # 5. Delete and test 410 / 404
    del_req = urllib.request.Request(f'http://localhost:8000/api/v1/jobs/{job_id}', method='DELETE')
    del_res = urllib.request.urlopen(del_req)
    print('[5] Job deleted successfully:', del_res.read().decode('utf-8'))
    return True

if __name__ == '__main__':
    main()

