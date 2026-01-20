using GameServer.Application.Interfaces;
using GameServer.Application.Services;
using GameServer.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSignalR();
builder.Services.AddSingleton<IGameManager, GameManager>();
builder.Services.AddSingleton<IChatService, ChatService>();
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});
//builder.Services.AddCors(options =>
//{
//    options.AddDefaultPolicy(policy =>
//    {
//        policy.WithOrigins("https://hien-unpremature-nikia.ngrok-free.dev")
//              .AllowAnyHeader()
//              .AllowAnyMethod()
//              .AllowCredentials();
//    });
//});

builder.WebHost.UseUrls("http://0.0.0.0:7027");
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowReact");
//app.UseCors();
//app.UseDefaultFiles();
//app.UseStaticFiles();

app.UseAuthorization();
app.MapControllers();
app.MapHub<GameHub>("/gamehub");
//app.MapFallbackToFile("index.html");

app.Run();
