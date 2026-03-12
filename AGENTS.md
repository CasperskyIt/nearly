# Nearly - Development Guidelines

## Project Overview

Nearly is a location-based discovery app that helps users find micro-adventures nearby (coffee spots, parks, viewpoints, street art, etc.).

- **Frontend**: Angular
- **Backend**: Spring Boot (Java 21)
- **Data**: OpenStreetMap, Places APIs
- **Architecture**: REST API

---

## Build & Test Commands

### Backend (Spring Boot)

```bash
# Build the project
./mvnw clean package -DskipTests

# Run the application
./mvnw spring-boot:run

# Run all tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=NearlyBackendApplicationTests

# Run a single test method
./mvnw test -Dtest=NearlyBackendApplicationTests#contextLoads

# Run tests with verbose output
./mvnw test -Dsurefire.useFile=false

# Run tests and skip compilation errors
./mvnw test-compile

# Check code style (if spotless is configured)
./mvnw spotless:check
./mvnw spotless:apply
```

---

## Code Style Guidelines

### General Principles

- Write clean, readable code over clever code
- Follow SOLID principles
- Keep methods small and focused (single responsibility)
- Use meaningful names for variables, methods, and classes

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `PlaceController`, `PlaceService` |
| Methods | camelCase | `getPlacesNearby()`, `savePlace()` |
| Variables | camelCase | `placeList`, `userLocation` |
| Constants | UPPER_SNAKE_CASE | `MAX_RADIUS_KM`, `DEFAULT_PAGE_SIZE` |
| Packages | lowercase | `com.casperskyIt.nearly_backend.controller` |
| DTOs | Sufix with DTO | `PlaceDTO`, `LocationDTO` |
| Entities | No suffix | `Place`, `User` |


### Java Conventions

```java
// Package declaration
package com.casperskyIt.nearly_backend.controller;

// Imports - organized: static, java, javax, spring, third-party
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// Class with Lombok - avoid redundant annotations
@RestController
@RequestMapping("/api/v1/places")
@RequiredArgsConstructor
public class PlaceController {
    
    private final PlaceService placeService;
    
    @GetMapping
    public ResponseEntity<List<PlaceDTO>> getNearbyPlaces(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "15") Integer radiusKm) {
        return ResponseEntity.ok(placeService.findNearby(lat, lng, radiusKm));
    }
}
```

### Import Organization

Order imports in groups (blank line between groups):
1. Static imports
2. `java.*` imports
3. `javax.*` imports
4. Spring framework imports
5. Third-party libraries
6. Project imports

### Types & Generics

```java
// Prefer interfaces over concrete types
List<Place> places = new ArrayList<>();  // Good
ArrayList<Place> places = new ArrayList<>();  // Avoid

// Use proper generic types
Map<String, PlaceDTO> placeMap = new HashMap<>();

// Avoid raw types
List<Place> list = new ArrayList<>();  // Good
List list = new ArrayList();  // Avoid
```

### Error Handling

```java
// Use global exception handler with @ControllerAdvice
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(PlaceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(PlaceNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage()));
    }
}

// Custom exceptions
public class PlaceNotFoundException extends RuntimeException {
    public PlaceNotFoundException(String message) {
        super(message);
    }
}
```

### DTOs & Entities

```java
// DTO - use record or class with builders
public record PlaceDTO(
    Long id,
    String name,
    String description,
    Double latitude,
    Double longitude,
    String category,
    Double rating
) {}

// Entity - use JPA annotations
@Entity
@Table(name = "places")
@Getter
@Setter
@NoArgsConstructor
public class Place {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    @Column(name = "latitude")
    private Double lat;
    
    @Column(name = "longitude")
    private Double lng;
    
    @Enumerated(EnumType.STRING)
    private PlaceCategory category;
}
```

### REST API Design

```java
// Use consistent URL patterns
GET    /api/v1/places          - list places
GET    /api/v1/places/{id}     - get single place
POST   /api/v1/places          - create place
PUT    /api/v1/places/{id}     - update place
DELETE /api/v1/places/{id}    - delete place

// Use proper HTTP status codes
200 - OK (success)
201 - Created (resource created)
204 - No Content (successful deletion)
400 - Bad Request (validation error)
404 - Not Found (resource doesn't exist)
500 - Internal Server Error

// Use @ResponseStatus for exceptions when appropriate
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException { }
```

### Logging

```java
// Use Lombok's @Slf4j
@Slf4j
public class PlaceService {
    
    public void doSomething() {
        log.info("Processing request with id: {}", requestId);
        log.debug("Debug info: {}", details);
        log.error("Error occurred: {}", errorMessage, exception);
    }
}
```

### Testing

```java
// Unit test with JUnit 5 and Mockito
@ExtendWith(MockitoExtension.class)
class PlaceServiceTest {
    
    @Mock
    private PlaceRepository placeRepository;
    
    @InjectMocks
    private PlaceService placeService;
    
    @Test
    void shouldReturnPlacesNearby() {
        // given
        Double lat = 52.2297;
        Double lng = 21.0122;
        List<Place> expected = List.of(new Place("Test Cafe"));
        when(placeRepository.findByLocation(any(), any())).thenReturn(expected);
        
        // when
        List<Place> result = placeService.findNearby(lat, lng, 10);
        
        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Cafe");
    }
}
```

### Configuration

```properties
# application.properties or application.yml
spring.application.name=nearly-backend
server.port=8080

# Database configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/nearly
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}

# Logging
logging.level.com.caspberryIt.nearly_backend=DEBUG
```

### Project Structure

```
src/
├── main/
│   ├── java/com/casperskyIt/nearly_backend/
│   │   ├── config/           # Configuration classes
│   │   ├── controller/        # REST controllers
│   │   ├── service/           # Business logic
│   │   ├── repository/        # Data access
│   │   ├── entity/            # JPA entities
│   │   ├── dto/               # Data transfer objects
│   │   ├── exception/         # Custom exceptions
│   │   └── NearlyBackendApplication.java
│   └── resources/
│       └── application.yml
└── test/
    └── java/com/casperskyIt/nearly_backend/
        └── service/           # Unit tests
```

---

## CI/CD & Quality Gates

Before submitting PR:
- [ ] `./mvnw clean package` succeeds
- [ ] All tests pass (`./mvnw test`)
- [ ] No new compiler warnings
- [ ] Code follows naming conventions

---

## Dependencies

Key dependencies (do not add without discussion):
- Spring Boot Starter Web
- Spring Data JPA
- Spring Security (if needed)
- Lombok
- MapStruct (for DTO mapping)
- OpenCSV (for CSV parsing)
- H2 (for testing)
