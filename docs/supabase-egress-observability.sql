-- Supabase Dashboard > Logs > Explorer > Run SQL
-- Query source: Logs. Start with a 1-hour range, then widen only if needed.

-- Most requested Storage objects, split by CDN cache result.
select
  log_attributes['request.path'] as filepath,
  log_attributes['response.headers.cf_cache_status'] as cache_status,
  count() as request_count
from logs
where source = 'edge_logs'
  and (
    log_attributes['request.path'] like '%storage/v1/object/%'
    or log_attributes['request.path'] like '%storage/v1/render/%'
  )
  and log_attributes['request.method'] = 'GET'
group by filepath, cache_status
order by request_count desc
limit 100;

-- Storage paths producing the most cache misses.
select
  log_attributes['request.path'] as filepath,
  log_attributes['request.search'] as query_string,
  count() as miss_count
from logs
where source = 'edge_logs'
  and startsWith(log_attributes['request.path'], '/storage/v1/object')
  and log_attributes['request.method'] = 'GET'
  and log_attributes['response.headers.cf_cache_status'] in (
    'MISS', 'NONE/UNKNOWN', 'EXPIRED', 'BYPASS', 'DYNAMIC'
  )
group by filepath, query_string
order by miss_count desc
limit 50;

-- Hourly Storage cache-hit ratio.
select
  toStartOfHour(timestamp) as hour,
  countIf(
    log_attributes['response.headers.cf_cache_status'] in (
      'HIT', 'STALE', 'REVALIDATED', 'UPDATING'
    )
  ) / count() as cache_hit_ratio
from logs
where source = 'edge_logs'
  and startsWith(log_attributes['request.path'], '/storage/v1/object')
  and log_attributes['request.method'] = 'GET'
group by hour
order by hour desc
limit 100;
