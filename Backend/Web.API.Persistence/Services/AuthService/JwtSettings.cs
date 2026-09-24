namespace Web.API.Persistence.Services.AuthService;

public class JwtSettings
{
    public string Issuer { get; set; } = "RSCMFAIS";
    public string Audience { get; set; } = "RSCMFAIS.Frontend";
    public string SigningKey { get; set; } = "RSCMFAIS-Development-Jwt-Signing-Key-2026-Change-Me";
    public int ExpiresHours { get; set; } = 8;
}
