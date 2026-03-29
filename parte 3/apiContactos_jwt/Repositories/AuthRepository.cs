using System.Data;
using Dapper;
using Npgsql;
using ContactsApi.Models;

namespace ContactsApi.Repositories;

public class AuthRepository
{
    private readonly string _conn;
    public AuthRepository(string conn) => _conn = conn;
    private IDbConnection Conn() => new NpgsqlConnection(_conn);

    public async Task<User?> GetByUsernameAsync(string username)
    {
        using var c = Conn();
        const string sql = "SELECT id, username, password_hash AS PasswordHash FROM users WHERE username=@u";
        return await c.QuerySingleOrDefaultAsync<User>(sql, new { u = username });
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        using var c = Conn();
        const string sql = "SELECT id, username, password_hash AS PasswordHash FROM users WHERE id=@id";
        return await c.QuerySingleOrDefaultAsync<User>(sql, new { id });
    }

    public async Task<int> CreateAsync(User u)
    {
        using var c = Conn();
        const string sql = "INSERT INTO users (username, password_hash) VALUES (@Username, @PasswordHash) RETURNING id";
        return await c.ExecuteScalarAsync<int>(sql, u);
    }

    public async Task SaveRefreshTokenAsync(int userId, string token, DateTime expires)
    {
        using var c = Conn();
        const string sql = @"INSERT INTO refresh_tokens (token,user_id,expires) 
                         VALUES (@token,@userId,@expires)";
        await c.ExecuteAsync(sql, new { token, userId, expires });
    }

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
    {
        using var c = Conn();
        const string sql = @"SELECT id, token, user_id AS UserId, expires, revoked
                         FROM refresh_tokens WHERE token=@token";
        return await c.QuerySingleOrDefaultAsync<RefreshToken>(sql, new { token });
    }

    public async Task RotateRefreshTokenAsync(RefreshToken oldTok, string newToken)
    {
        using var c = Conn();
        await c.ExecuteAsync(
            "UPDATE refresh_tokens SET revoked=TRUE WHERE id=@id",
            new { oldTok.Id });

        await c.ExecuteAsync(
            "INSERT INTO refresh_tokens (token,user_id,expires) VALUES (@tok,@uid,@exp)",
            new { tok = newToken, uid = oldTok.UserId, exp = DateTime.UtcNow.AddDays(14) });
    }

    public class RefreshToken
    {
        public int Id { get; set; }
        public string Token { get; set; } = null!;
        public int UserId { get; set; }
        public DateTime Expires { get; set; }
        public bool Revoked { get; set; }
    }
}
