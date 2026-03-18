using System;
using FluentAssertions;
using ProjectHub.Api.Services;
using Xunit;

namespace ProjectHub.Api.Tests.Helpers;

public class PasswordHelperTests
{
    [Fact]
    public void HashPassword_returnsSaltHashFormat()
    {
        var stored = PasswordHelper.HashPassword("AnyPassword123");

        stored.Should().NotBeNullOrWhiteSpace();

        var parts = stored.Split(':');
        parts.Length.Should().Be(2, because: "stored format must be base64Salt:base64Hash");

        Action parseSalt = () => Convert.FromBase64String(parts[0]);
        Action parseHash = () => Convert.FromBase64String(parts[1]);

        parseSalt.Should().NotThrow();
        parseHash.Should().NotThrow();
    }

    [Fact]
    public void VerifyPassword_returnsTrue_forCorrectPassword()
    {
        const string password = "CorrectPassword123";
        var stored = PasswordHelper.HashPassword(password);

        var result = PasswordHelper.VerifyPassword(password, stored);

        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_returnsFalse_forWrongPassword()
    {
        const string correctPassword = "CorrectPassword123";
        const string wrongPassword = "WrongPassword123";

        var stored = PasswordHelper.HashPassword(correctPassword);

        var result = PasswordHelper.VerifyPassword(wrongPassword, stored);

        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_returnsFalse_forMalformedStoredHash()
    {
        var result = PasswordHelper.VerifyPassword("AnyPassword123", "not-a-valid-format");

        result.Should().BeFalse();
    }
}

