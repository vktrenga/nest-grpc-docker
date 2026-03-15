# Ecommerce System Monorepo

A microservices-based ecommerce backend built with NestJS, supporting authentication, product management, and order processing. Each service is containerized and can be run locally or with Docker Compose.

## Features

### Auth Service
- User login with JWT authentication
- User roles support (customer, employee, admin)
- Simple user data from JSON (for demo/testing)
- **Rate limiting (Throttle):** Login endpoint is protected with rate limiting (3 requests per 60 seconds per IP) to prevent brute-force attacks.
- **Security:** Access tokens are set as httpOnly, secure, sameSite=strict cookies (not exposed to JavaScript), enhancing session security.

### Product Service
- CRUD operations for products (create, update, delete, get)
- Product variants (SKU, price, stock, attributes)
- Product search and filtering (by name, category, brand)
- Seed products from JSON
- Role-based access (admin/employee/customer)
- Soft delete for product variants & product
- **Rate limiting (Throttle):** Product listing endpoint is protected with rate limiting (20 requests per 60 seconds per IP) to prevent abuse.

### Order Service
- Create orders for authenticated users
- Add items to orders, with stock and price validation
- Complete orders with price and stock checks
- View order details and history (for customers, employees, admins)
- Pagination and filtering for order queries
- Caching of product data with Redis
- Integration with Product Service via gRPC
- **Rate limiting (Throttle):** Product listing endpoint is protected with rate limiting (20 requests per 60 seconds per IP) to prevent abuse.

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



## Postman Collection

- [API Collection](nest-grpc-docker.postman_collection-api)
- [Environment File](nest-grpc-docker.postman_collection-env.json)

---
## API Endpoints

Below is a summary of the main API endpoints available in this ecommerce system, as defined in the Postman collection:

### Auth Service (http://localhost:3001)
- **POST /login** — Admin Login
	- Body: `{ "username": "admin", "password": "password123" }`
- **POST /login** — Management Login
	- Body: `{ "username": "management", "password": "password123" }`
- **POST /login** — Customer Login
	- Body: `{ "username": "customer1", "password": "password123" }`

### Product Service (http://localhost:3003)
- **POST /products/seed/** — Seed products (admin only)
- **POST /products/** — Create product (employee & admin only)
- **PATCH /products/:id** — Update product (employee & admin only)
- **GET /products** — List products (All)
	- Query: `page`, `limit`
- **GET /products/:id** — Get a product (all)
- **GET /products/:id** — Delete a product (employee & admin)

### Order Service (http://localhost:3002)
- **POST /orders/** — Create order (customer)
- **POST /orders/:orderId/add-item** — Add item to order (customer)
- **GET /orders/:orderId/** — Get order items (customer)
- **POST /orders/:orderId/complete** — Complete order (customer)
- **GET /orders/me** — My orders (customer)
	- Query: `status`, `limit`, `page`
- **GET /orders** — All customer orders (admin/employee)
	- Query: `status`, `limit`, `page`

---
## Project Structure

- `apps/` - Microservices (auth-service, order-service, product-service)
- `libs/common/` - Shared code and proto files

---

