namespace GameServer.Domain.Entities
{
    public class User
    {
        public Guid UserId { get; set; }
        public string? Username { get; set; }
        public string? Password { get; set; }
    }
}
