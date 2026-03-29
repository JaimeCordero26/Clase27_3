namespace ContactsApi.Helpers;

public static class PasswordHasher
{
    public static string Hash(string pwd) => BCrypt.Net.BCrypt.HashPassword(pwd);
    public static bool Verify(string pwd, string hash) => BCrypt.Net.BCrypt.Verify(pwd, hash);
}
