-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('insert', 'update', 'delete');


create or replace function f_generic_history()
returns trigger
as $$
declare
    vc_insert_sql constant text := 'insert into '||TG_TABLE_NAME||'_history ( "operationType", "oldRowData", "newRowData", "primaryKeyValue" ) values ( $1, $2, $3, $4 )' ;
    v_message text ;
    v_detail text ;
    v_hint text ;
begin
    if TG_OP = 'INSERT' then
        execute vc_insert_sql using 'insert', null::json, row_to_json( NEW ), NEW."id" ;

    elsif (TG_OP = 'UPDATE' and OLD is distinct from NEW)
    then
        execute vc_insert_sql using 'update', row_to_json( OLD ), row_to_json( NEW ), NEW."id" ;
    elsif TG_OP = 'DELETE'
    then
        execute vc_insert_sql using 'delete', row_to_json( OLD ), null::json, OLD."id" ;
    end if ;

    return null ;

exception
    when others then
        get stacked diagnostics v_message := MESSAGE_TEXT
                              , v_detail := PG_EXCEPTION_DETAIL
                              , v_hint := PG_EXCEPTION_HINT ;
        raise warning 'SQLSTATE % in f_generic_history(%) on table %.%; MESSAGE=%; DETAIL=%; HINT=%', SQLSTATE, TG_ARGV[0], TG_TABLE_SCHEMA, TG_TABLE_NAME, v_message, v_detail, v_hint ;
        return null ;
end ;
$$ language plpgsql;


create or replace function f_parse_last_modified_by()
returns trigger
as $$
declare
    v_id text;
    v_type text;
    v_last_modified_by text;
begin
    if TG_OP = 'DELETE' then
        v_last_modified_by := OLD."lastModifiedBy";
    else 
        v_last_modified_by := NEW."lastModifiedBy";
    end if;

    -- Return early if "unknown"
    if v_last_modified_by = 'unknown' then
        return NEW;
    end if;

    v_type := split_part(v_last_modified_by, ':', 1);
    v_id := split_part(v_last_modified_by, ':', 2);

    if v_id = '' then
        raise exception 'Invalid lastModifiedBy format: %', v_last_modified_by;
    end if;

    case v_type
        when 'user' then
            if not exists (select 1 from users where id = v_id) then
                raise exception 'User not found with id: %', v_id;
            end if;
        when 'api' then
            if not exists (select 1 from api_access_tokens where id = v_id) then
                raise exception 'API access token not found with id: %', v_id;
            end if;
        when 'action' then
            if not exists (select 1 from action_runs where id = v_id) then
                raise exception 'Action run not found with id: %', v_id;
            end if;
        else
            raise exception 'Invalid lastModifiedBy type: %', v_type;
    end case;

    return NEW;
end;
$$ language plpgsql;

