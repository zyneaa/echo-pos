# ==============================================================================
# Development Operations (Server & Client Concurrent)
# ==============================================================================

.PHONY: dev
dev: fmt vet
	@echo "Starting both Go server and Expo client concurrently..."
	@if command -v npx > /dev/null; then \
		npx concurrently \
			-n "Server,Client" \
			-c "cyan,magenta" \
			"cd server && go run cmd/api/main.go" \
			"cd client && npm run start"; \
	else \
		echo "Installing 'concurrently' globally to run both tasks..."; \
		npm install -g concurrently; \
		concurrently -n "Server,Client" -c "cyan,magenta" "cd server && go run cmd/api/main.go" "cd client && npm run start"; \
	fi

.PHONY: install
install:
	@echo "Installing Go dependencies..."
	cd server && go mod tidy
	@echo "Installing React Native / Expo npm packages..."
	cd client && npm install

# ==============================================================================
# Backend Operations (Go Server)
# ==============================================================================

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

.PHONY: run-server
run-server: fmt vet
	@echo "Starting local Go development server..."
	cd server && go run cmd/api/main.go

.PHONY: seed
seed:
	@echo "Seeding the database..."
	cd server && go run cmd/seed/main.go

.PHONY: test-server
test-server:
	@echo "Running Go unit tests..."
	cd server && go test -v -race ./...

# ==============================================================================
# Frontend Operations (Expo Client)
# ==============================================================================

.PHONY: run-client
run-client:
	@echo "Starting Expo development client..."
	cd client && npm run start

.PHONY: android
android:
	@echo "Booting Android Emulator..."
	cd client && npm run android

.PHONY: ios
ios:
	@echo "Booting iOS Simulator..."
	cd client && npm run ios

.PHONY: web
web:
	@echo "Opening project in the web browser..."
	cd client && npm run web

# ==============================================================================
# Code Quality & Cleanup
# ==============================================================================

.PHONY: lint
lint:
	@echo "Running Go vet..."
	cd server && go vet ./...
	@echo "Running Expo project linting..."
	cd client && npm run lint

.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf build/
	@echo "Cleaning frontend cache..."
	rm -rf client/.expo client/node_modules/.cache
