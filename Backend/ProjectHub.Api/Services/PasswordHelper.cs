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

    public static bool TryValidatePasswordComplexity(string password, out string errorMessage)
    {
        errorMessage = string.Empty;

        if (string.IsNullOrWhiteSpace(password))
        {
            errorMessage = "Password is required.";
            return false;
        }

        if (password.Length < 8)
        {
            errorMessage = "Password must be at least 8 characters long.";
            return false;
        }

        var hasUpper = false;
        var hasLower = false;
        var hasDigit = false;

        foreach (var c in password)
        {
            if (c is >= 'A' and <= 'Z') hasUpper = true;
            else if (c is >= 'a' and <= 'z') hasLower = true;
            else if (c is >= '0' and <= '9') hasDigit = true;
        }

        if (!hasUpper)
        {
            errorMessage = "Password must contain at least one uppercase English letter (A-Z).";
            return false;
        }

        if (!hasLower)
        {
            errorMessage = "Password must contain at least one lowercase English letter (a-z).";
            return false;
        }

        if (!hasDigit)
        {
            errorMessage = "Password must contain at least one digit (0-9).";
            return false;
        }

        return true;
    }
}

