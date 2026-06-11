import subprocess

repo_url = 'https://u1970590922:<SECRET_1e8a0c80>@github.com/u1970590922/line-food-bot.git'

cmds = [
    ['git', 'remote', 'set-url', 'origin', repo_url],
    ['git', 'push', '-u', 'origin', 'main'],
]

for cmd in cmds:
    print(f'> {" ".join(cmd)}')
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stdout)
    if r.returncode != 0:
        print('STDERR:', r.stderr)
        break
