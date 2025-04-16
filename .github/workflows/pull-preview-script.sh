# install latest version of docker compose, by default it's using an ancient version
sudo curl -sL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-"$(uname -m)" \
  -o "$(which docker-compose)" && sudo chmod +x "$(which docker-compose)" 

docker image prune -a -f

df -h
