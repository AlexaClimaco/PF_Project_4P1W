using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtIssuer = jwtSection["Issuer"] ?? "PF_Project_4P1W";
var jwtAudience = jwtSection["Audience"] ?? "PF_Project_4P1W.Client";
var jwtSigningKey = jwtSection["SigningKey"] ?? "replace_with_strong_key_please_change";
var signingKeyBytes = Encoding.UTF8.GetBytes(jwtSigningKey);

builder.Services.AddCors(options =>
{
    options.AddPolicy("WebApp", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
    });
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(signingKeyBytes)
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("WebApp");
app.UseAuthentication();
app.UseAuthorization();

var users = new List<AppUser>
{
    new("1", "admin@pfproject.local", "Admin123!", "admin"),
    new("2", "player@pfproject.local", "Player123!", "player")
};

app.MapPost("/auth/register", (RegisterRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { message = "Email and password are required." });
    }

    var normalizedEmail = request.Email.Trim().ToLowerInvariant();
    if (users.Any(user => user.Email == normalizedEmail))
    {
        return Results.Conflict(new { message = "Email is already registered." });
    }

    var role = string.Equals(request.Role, "admin", StringComparison.OrdinalIgnoreCase) ? "admin" : "player";
    var newUser = new AppUser(Guid.NewGuid().ToString("N"), normalizedEmail, request.Password, role);
    users.Add(newUser);

    return Results.Ok(new AuthUserResponse(newUser.Id, newUser.Email, newUser.Role));
});

app.MapPost("/auth/login", (LoginRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { message = "Email and password are required." });
    }

    var normalizedEmail = request.Email.Trim().ToLowerInvariant();
    var user = users.FirstOrDefault(item => item.Email == normalizedEmail && item.Password == request.Password);
    if (user is null)
    {
        return Results.Unauthorized();
    }

    var token = BuildToken(user, jwtIssuer, jwtAudience, signingKeyBytes);
    return Results.Ok(new AuthTokenResponse(token, new AuthUserResponse(user.Id, user.Email, user.Role)));
});

app.MapGet("/auth/me", [Authorize] (ClaimsPrincipal principal) =>
{
    var id = principal.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? string.Empty;
    var email = principal.FindFirstValue(JwtRegisteredClaimNames.Email) ?? string.Empty;
    var role = principal.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    return Results.Ok(new AuthUserResponse(id, email, role));
});

app.Run();

static string BuildToken(AppUser user, string issuer, string audience, byte[] signingKeyBytes)
{
    var credentials = new SigningCredentials(
        new SymmetricSecurityKey(signingKeyBytes),
        SecurityAlgorithms.HmacSha256
    );

    var claims = new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub, user.Id),
        new(JwtRegisteredClaimNames.Email, user.Email),
        new(ClaimTypes.Role, user.Role)
    };

    var token = new JwtSecurityToken(
        issuer: issuer,
        audience: audience,
        claims: claims,
        expires: DateTime.UtcNow.AddHours(4),
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}

record AppUser(string Id, string Email, string Password, string Role);
record RegisterRequest(string Email, string Password, string? Role);
record LoginRequest(string Email, string Password);
record AuthUserResponse(string Id, string Email, string Role);
record AuthTokenResponse(string Token, AuthUserResponse User);
