# Possible ideas


```
$$pubs[size < $length($input.body.entries) and status = $input.status]^(>priority, created_at).{
  "title": $.title,
  "snippet": $substring($.body, 0, $input.config.snippet_length),
  "query_terms": $split($lower($input.query), " ")
}
```


Tricky: how to signal to the user that `size` is different?


Eg, this would not be allowed

```
$$[(size + 6) < $length($input.body.entries) and status = $input.status]
```
or we would at least need to be able to extract the "+ 6" to the other side of the comparison.

Most functions are kind of hard to invert

```
$$[($round(size)) < $length($input.body.entries)] 
```


We also can't really allow dynamic column creation (not even sure this is valid jsonata)

```
$$[($.($.type & "_id") = "pub")]

```


It would be amazing if we can have nested queries

eg find all blog posts that are larger than the average size of journal articles
```
$$[type = 'blog post' and size > $avg($$[type = "journal article"].size)] 
```

