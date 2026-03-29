using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ContactsApi.Repositories;
using ContactsApi.Helpers;
using ContactsApi.Models;
using Npgsql;
using Dapper;

namespace ContactsApi.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthRepository _repo;
    private readonly IConfiguration _cfg;
    public AuthController(AuthRepository repo, IConfiguration cfg)
    {
        _repo = repo;
        _cfg = cfg;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Usuario y contraseña requeridos.");

        var existing = await _repo.GetByUsernameAsync(dto.Username);
        if (existing != null) return Conflict("Usuario ya existe.");

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = PasswordHasher.Hash(dto.Password)
        };
        user.Id = await _repo.CreateAsync(user);
        return Ok("Usuario creado");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var u = await _repo.GetByUsernameAsync(dto.Username);
        if (u == null || !PasswordHasher.Verify(dto.Password, u.PasswordHash))
            return Unauthorized("Credenciales incorrectas.");

        var token = GenerateJwt(u);
        var refresh = Guid.NewGuid().ToString("N");
        await _repo.SaveRefreshTokenAsync(u.Id, refresh, DateTime.UtcNow.AddDays(14));
        return Ok(new { accessToken = token, refreshToken = refresh, expiresIn = 3600 });
    }

    private string GenerateJwt(User u)
    {
        var key = Encoding.UTF8.GetBytes(_cfg["JwtKey"]!);
        var creds = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, u.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, u.Username)
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public record LoginDto(string Username, string Password);

    public record RefreshDto(string RefreshToken);

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshDto dto)
    {
        var stored = await _repo.GetRefreshTokenAsync(dto.RefreshToken);
        if (stored == null || stored.Revoked || stored.Expires < DateTime.UtcNow)
            return Unauthorized("Refresh token inválido.");

        var user = await _repo.GetByIdAsync(stored.UserId);
        if (user == null) return Unauthorized();

        var newAccess = GenerateJwt(user);
        var newRefresh = Guid.NewGuid().ToString("N");
        await _repo.RotateRefreshTokenAsync(stored, newRefresh);

        return Ok(new
        {
            accessToken = newAccess,
            refreshToken = newRefresh,
            expiresIn = 3600
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshDto dto)
    {
        var stored = await _repo.GetRefreshTokenAsync(dto.RefreshToken);
        if (stored != null && !stored.Revoked)
        {
            stored.Revoked = true;
            using var c = new NpgsqlConnection(_cfg.GetConnectionString("PostgresConn"));
            await c.ExecuteAsync("UPDATE refresh_tokens SET revoked=TRUE WHERE id=@id", new { stored.Id });
        }
        return NoContent();
    }
}
