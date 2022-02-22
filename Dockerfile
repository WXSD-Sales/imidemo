#sudo docker build -t imidemo-bot .
#sudo docker run -i -p 10031:10031 -t imidemo-bot

#aws ecr get-login-password --region us-west-1 | docker login --username AWS --password-stdin 191518685251.dkr.ecr.us-west-1.amazonaws.com
#docker tag imidemo-bot:latest 191518685251.dkr.ecr.us-west-1.amazonaws.com/imidemo-bot:latest
#docker push 191518685251.dkr.ecr.us-west-1.amazonaws.com/imidemo-bot:latest

#I think this only has to be done 1 time.
#aws ecr create-repository --repository-name imidemo-bot

#aws eks --region us-west-1 update-kubeconfig --name bdm-cluster
#kubectl cluster-info

#kubectl apply -f imidemo-bot.yaml
#kubectl get ingress -n imidemo-bot

#kubectl get pods
#kubectl describe pod <pod name>

FROM node:16.9-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

#overwrite default environment variables
COPY bdm.env .env

CMD [ "npm", "start" ]
