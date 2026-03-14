# Ecommerce System Monorepo

A microservices-based ecommerce backend built with NestJS, supporting authentication, product management, and order processing. Each service is containerized and can be run locally or with Docker Compose.

## Features

### Auth Service
- User login with JWT authentication
- User roles support (customer, employee, admin)
- Simple user data from JSON (for demo/testing)

### Product Service
- CRUD operations for products (create, update, delete, get)
- Product variants (SKU, price, stock, attributes)
- Product search and filtering (by name, category, brand)
- Seed products from JSON
- Role-based access (admin/employee/customer)
- Soft delete for product variants & product

### Order Service
- Create orders for authenticated users
- Add items to orders, with stock and price validation
- Complete orders with price and stock checks
- View order details and history (for customers, employees, admins)
- Pagination and filtering for order queries
- Caching of product data with Redis
- Integration with Product Service via gRPC

### Common Library
- Shared decorators, guards, interceptors, and logger
- Protobuf definitions for gRPC communication

## Run Instructions

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### Local Development

1. **Install dependencies:**
	```
	npm install
	```

2. **Build all services:**
	```
	npm run build
	```

3. **Start all services in development mode:**
	```
	npm run run:all:dev
	```
	Or start individual services:
	```
	npm run start:dev:auth-service
	npm run start:dev:order-service
	npm run start:dev:product-service
	```

4. **Run all tests:**
	```
	npm test
	```

5. **Run unit tests for OrderService or ProductService only:**
	```
	# OrderService
	npx jest apps/order-service/src/order-service.service.spec.ts

	# ProductService
	npx jest apps/product-service/src/product-service.service.spec.ts
	```

### Using Docker Compose

1. **Build and start all services and dependencies:**
	```
	docker-compose up --build
	```
	This will start:
	- Auth Service (port 3001)
	- Order Service (port 3002)
	- Product Service (port 3003)
	- MongoDB, PostgreSQL, Redis

2. **Stop all services:**
	```
	docker-compose down
	```

## Environment Variables

- See `docker-compose.yml` for all environment variables (JWT secrets, DB URIs, etc).

## Project Structure

- `apps/` - Microservices (auth-service, order-service, product-service)
- `libs/common/` - Shared code and proto files

---

