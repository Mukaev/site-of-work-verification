FROM gitpod/workspace-mysql
                    
USER root

RUN apt-get -q update && \
     apt-get install -y nodejs
    
RUN npm install -g nodemon

