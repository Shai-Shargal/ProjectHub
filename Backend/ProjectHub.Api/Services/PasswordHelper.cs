using System.Security.Cryptography;

namespace ProjectHub.Api.Services;

public static class PasswordHelper
{
    // PBKDF2 parameters. Keep these constants stable to ensure VerifyPassword works.
    private const int SaltSizeBytes = 16;
    private const int HashSizeBytes = 32;
    private const int Iterations = 100_000;

    // Stored format: base64Salt:base64Hash
    public static string HashPassword(string password)
    {
        if (password is null)
        {
            throw new ArgumentNullException(nameof(password));
        }

        var salt = RandomNumberGenerator.GetBytes(SaltSizeBytes);
        using var pbkdf2 = new Rfc2898DeriveBytes(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256);

        var hash = pbkdf2.GetBytes(HashSizeBytes);
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string storedPasswordHash)
    {
        if (password is null || string.IsNullOrWhiteSpace(storedPasswordHash))
        {
            return false;
        }

        var parts = storedPasswordHash.Split(':', 2);
        if (parts.Length != 2)
        {
            return false;
        }

        byte[] salt;
        byte[] expectedHash;
        try
        {
            salt = Convert.FromBase64String(parts[0]);
            expectedHash = Convert.FromBase64String(parts[1]);
        }
        catch
        {
            return false;
        }

        using var pbkdf2 = new Rfc2898DeriveBytes(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256);

        var actualHash = pbkdf2.GetBytes(HashSizeBytes);
        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }
}

