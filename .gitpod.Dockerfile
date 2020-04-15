FROM gitpod/workspace-mysql
                    
USER gitpod

RUN sudo apt-get -q update && \
     sudo apt-get install nodejs
    
RUN npm install -g nodemon

