FROM nginx:1.27.0
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./index.en.html /usr/share/nginx/html/index.html
COPY ./profiles /usr/share/nginx/html/profiles
COPY ./favicon.ico ./modernizr.js ./sudoku.css ./eventemitter.js ./jquery-1.7.1.js ./jquery-svg.js ./jquery-svgdom.js ./sudoku.js ./manager.js /usr/share/nginx/html/
