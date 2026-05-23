.PHONY: fmt
fmt:
	@echo "Formatting all Go code inside server/..."
	cd server && go fmt ./...

.PHONY: vet
vet:
	@echo "Running static analysis inside server/..."
	cd server && go vet ./...

.PHONY: build
build: fmt vet
	@echo "Building production binary to build/bin/api..."
	@mkdir -p build/bin
	cd server && go build -o ../build/bin/api cmd/api/main.go

.PHONY: run
run: fmt vet
	@echo "Starting local development server..."
	cd server && go run cmd/api/main.go

.PHONY: test
test:
	@echo "Running unit tests inside server/..."
	cd server && go test -v -race ./...

.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf build/
