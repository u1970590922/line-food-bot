import subprocess

# 推送代码到 GitHub
repo_url = 'https://<SECRET_9997f9be>'

cmds = [
    ['git', 'remote', 'set-url', 'origin', repo_url],
    ['git', 'push', '-u', 'origin', 'main'],
]

for cmd in cmds:
    print(f'> {" ".join(cmd)}')
    r = subprocess.run(cmd, capture_output=True, text=True, cwd='C:/Users/Gary/line-food-bot')
    print(r.stdout)
    if r.returncode != 0:
        print('STDERR:', r.stderr)
