# Define variables for easy modification
IMAGE_NAME = docker_backend
CONTAINER_NAME = pdf2mdhub_backend
APP_PORT = 5000
DOCKERFILE_DIR = docker # <--- NEW: Define the directory where your Dockerfile resides

# Phony targets prevent conflicts with actual files named 'build', 'run', etc.
.PHONY: build run stop rm clean logs shell help

# Default target
all: build run

help:
	@echo "Makefile targets:"
	@echo "  build        - Builds the Docker image."
	@echo "  run          - Runs the Docker container (detached)."
	@echo "  stop         - Stops the running Docker container."
	@echo "  rm           - Removes the Docker container."
	@echo "  clean        - Stops, removes container, and prunes images."
	@echo "  logs         - Displays logs of the running container."
	@echo "  shell        - Gets a bash shell inside the running container."
	@echo "  up           - Builds and runs the container (alias for 'build run')."

build:
	@echo "Building Docker image $(IMAGE_NAME)..."
	# MODIFIED: Use -f to specify Dockerfile path and '.' for the build context
	docker build -t $(IMAGE_NAME) -f $(DOCKERFILE_DIR)/Dockerfile .

run: build
	@echo "Running Docker container $(CONTAINER_NAME) on port $(APP_PORT)..."
	docker run -p $(APP_PORT):$(APP_PORT) --name $(CONTAINER_NAME) -d $(IMAGE_NAME)

up: build run

stop:
	@echo "Stopping Docker container $(CONTAINER_NAME)..."
	docker stop $(CONTAINER_NAME) || true

rm:
	@echo "Removing Docker container $(CONTAINER_NAME)..."
	docker rm -f $(CONTAINER_NAME) || true

clean: stop rm
	@echo "Cleaning up Docker images..."
	docker image prune -f

logs:
	@echo "Displaying logs for $(CONTAINER_NAME)..."
	docker logs -f $(CONTAINER_NAME)

shell:
	@echo "Getting a shell in container $(CONTAINER_NAME)..."
	docker exec -it $(CONTAINER_NAME) bash