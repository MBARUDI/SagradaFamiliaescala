import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    server_address = ('127.0.0.1', 8085)
    httpd = HTTPServer(server_address, NoCacheHandler)
    print("SERVIDOR_PRONTO: http://127.0.0.1:8085/", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
