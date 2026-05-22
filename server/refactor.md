├── cmd/
│   └── api/
│       └── main.go          # App entry point (wires up dependencies and starts server)
├── internal/                # Private application and business code (cannot be imported by external repos)
│   ├── config/              # App configuration loading (env vars, flags)
│   ├── database/            # Database connections and migrations
│   └── user/                # Domain component (Vertical Slice)
│       ├── handler.go       # HTTP/gRPC transport layer (handles requests/responses)
│       ├── service.go       # Pure business logic (validations, calculations)
│       ├── repository.go    # Data access interface and implementation (SQL queries)
│       └── model.go         # Domain entities / structs
├── pkg/                     # Public library code (can be safely imported by other projects)
│   └── logger/              # Custom structured logger wrapper
├── .env.example             # Template for environment variables
├── Dockerfile               # Production multi-stage Docker build
├── go.mod
└── go.sum
