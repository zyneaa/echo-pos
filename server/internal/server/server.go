package server

import (
	"github.com/zyneaa/server/internal/pos"
	"github.com/zyneaa/server/internal/user"
	"net/http"
	"time"
)

type Server struct {
	port  string
	userH *user.Handler
	posH  *pos.Handler
}

func NewServer(port string, userH *user.Handler, posH *pos.Handler) *Server {
	return &Server{
		port:  port,
		userH: userH,
		posH:  posH,
	}
}

func (s *Server) Start() error {
	srv := &http.Server{
		Addr:         "0.0.0.0:" + s.port,
		Handler:      s.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return srv.ListenAndServe()
}
