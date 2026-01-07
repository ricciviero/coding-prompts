# Guida Swagger (Springdoc OpenAPI) per Spring Boot

Questa guida mostra una configurazione tipo, basata sulla struttura del progetto ZichellaBe, per abilitare Swagger/OpenAPI in un progetto Java Spring Boot.
Include anche note di compatibilita per portare la configurazione su altri backend.

## Compatibilita (importante)

Springdoc cambia dipendenze e configurazioni in base a:
- Spring Boot 4 (Spring Framework 7) vs Boot 3 (Spring Framework 6) vs Boot 2 (Spring Framework 5)
- Web MVC vs WebFlux

Scegli la dipendenza corretta:
- Boot 4 + Web MVC: `springdoc-openapi-starter-webmvc-ui` (3.x)
- Boot 4 + WebFlux: `springdoc-openapi-starter-webflux-ui` (3.x)
- Boot 3 + Web MVC: `springdoc-openapi-starter-webmvc-ui` (2.x)
- Boot 3 + WebFlux: `springdoc-openapi-starter-webflux-ui` (2.x)
- Boot 2.x + Web MVC: `springdoc-openapi-ui` (1.6.x)

Nota pratica: su Boot 4, le versioni 2.x causano errori tipo
`NoSuchMethodError: ControllerAdviceBean.<init>(Object)` perche usano API di Spring 6.

Se il backend target usa WebFlux o Boot 2, la dipendenza e la security vanno adattate (vedi sezione SecurityConfig).

## 1) Dipendenza Maven

Aggiungi la dipendenza Springdoc UI (vedi compatibilita sopra):

```xml
<properties>
  <springdoc.version>3.0.0</springdoc.version>
</properties>

<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>${springdoc.version}</version>
</dependency>
```

## 2) application.yml (base)

Imposta le property base e un base url per i server OpenAPI:

```yaml
springdoc:
  api-docs:
    enabled: true
  swagger-ui:
    enabled: true

app:
  api:
    base-url: ${APP_API_BASE_URL:http://localhost:8080}
```

Suggerimento per profili:
- dev: lascia abilitato
- prod: disabilita

```yaml
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false
```

## 3) OpenApiConfig

Crea una configurazione con informazioni, schema JWT e raggruppamenti per path.

```java
@Configuration
public class OpenApiConfig {

  private static final String SECURITY_SCHEME_NAME = "bearer-jwt";

  @Value("${app.api.base-url:http://localhost:8080}")
  private String apiBaseUrl;

  @Bean
  public OpenAPI openAPI() {
    return new OpenAPI()
      .info(new Info()
        .title("My API")
        .description("Descrizione servizio")
        .version("v1"))
      .components(new Components()
        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
          .type(SecurityScheme.Type.HTTP)
          .scheme("bearer")
          .bearerFormat("JWT")))
      .addServersItem(new Server().url(apiBaseUrl));
  }

  @Bean
  public GroupedOpenApi authApi() {
    return GroupedOpenApi.builder()
      .group("auth")
      .pathsToMatch("/api/v1/auth/**")
      .pathsToExclude("/api/v1/auth/admin/**")
      .build();
  }

  @Bean
  public GroupedOpenApi adminAuthApi() {
    return GroupedOpenApi.builder()
      .group("admin-auth")
      .pathsToMatch("/api/v1/auth/admin/**")
      .build();
  }

  @Bean
  public GroupedOpenApi usersApi() {
    return GroupedOpenApi.builder()
      .group("users")
      .pathsToMatch("/api/v1/users/**")
      .build();
  }

  @Bean
  public GroupedOpenApi profileApi() {
    return GroupedOpenApi.builder()
      .group("profile")
      .pathsToMatch("/api/v1/profile/**")
      .build();
  }

  @Bean
  public GroupedOpenApi preferencesApi() {
    return GroupedOpenApi.builder()
      .group("preferences")
      .pathsToMatch("/api/v1/preferences/**")
      .build();
  }

  @Bean
  public GroupedOpenApi positionsApi() {
    return GroupedOpenApi.builder()
      .group("positions")
      .pathsToMatch("/api/v1/positions/**")
      .build();
  }
}
```

Note:
- il base url viene letto da property, cosi puoi cambiarlo per ambiente
- i gruppi mostrano sezioni separate in Swagger UI
- i path devono rispecchiare le route reali
- se vuoi usare la stessa property di ZichellaBe, rinomina in `zichella.api.base-url` anche qui
- dietro reverse proxy/HTTPS valuta di non impostare `servers` o di usare header forwarded corretti
- evitare placeholder del tipo `${server.port}` dentro al default della property: in bootstrap puo non essere risolto

## 4) SecurityConfig

Consenti accesso alle route di swagger e ai doc.
Per Boot 4/3 / Spring Security 6/7:

```java
.requestMatchers("/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
```

Per Boot 2 / Spring Security 5 (config legacy):
```java
antMatchers("/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
```

## 5) Annotazioni nei controller

Documenta ogni controller con `@Tag` e ogni endpoint con `@Operation`.
Per endpoint protetti, aggiungi `@SecurityRequirement`.
Se imposti la security a livello globale in `OpenApiConfig`, allora tutti gli endpoint risultano protetti:
- opzione A: rimuovi `.addSecurityItem(...)` dal bean `OpenAPI` e annota solo i protetti
- opzione B: lascia globale e per gli endpoint public usa `@Operation(security = {})`
Per parametri non ovvi, usa `@Parameter`.

Esempio:

```java
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin", description = "Operazioni amministrative")
@SecurityRequirement(name = "bearer-jwt")
public class AdminController {

  @GetMapping("/users/{userId}")
  @Operation(summary = "Dettaglio utente", description = "Recupera i dati di un utente")
  public UserResponse getUser(
      @Parameter(description = "ID utente") @PathVariable Long userId) {
    // ...
  }
}
```

## 6) Endpoint utili

- Swagger UI: `/swagger-ui/index.html` (o `/swagger-ui.html`)
- OpenAPI JSON: `/v3/api-docs`
- OpenAPI per gruppo: `/v3/api-docs/{group}`

## 7) Check rapido

- Springdoc presente nelle dipendenze
- Versione Springdoc compatibile con la versione di Spring Boot
- `OpenApiConfig` registrato come `@Configuration`
- Property `springdoc` attive nel profilo in uso
- Security aperta per swagger
- Controller annotati con `@Tag` e `@Operation`
