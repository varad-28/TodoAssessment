using System.Data;

namespace TodoApi.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}