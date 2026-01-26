# JSONata Query Syntax

Query language for filtering pubs. Based on JSONata with restrictions.

## Paths

### Pub field values

```
$.pub.values.title
$.pub.values.externalId
```

### Builtin fields

```
$.pub.id
$.pub.createdAt
$.pub.updatedAt
$.pub.pubTypeId
$.pub.title
$.pub.stageId
```

### Pub type

```
$.pub.pubType.name
$.pub.pubType.id
```

## Comparison operators

### Equality

```
$.pub.values.title = "Test"
$.pub.values.count != 0
```

### Numeric comparison

```
$.pub.values.count > 10
$.pub.values.count >= 10
$.pub.values.count < 100
$.pub.values.count <= 100
```

### In array

```
$.pub.values.status in ["draft", "published"]
```

## Logical operators

### And

```
$.pub.values.status = "published" and $.pub.values.count > 0
```

### Or

```
$.pub.values.status = "draft" or $.pub.values.status = "pending"
```

### Not

```
$not($.pub.values.archived = true)
```

## String functions

### Contains

```
$contains($.pub.values.title, "chapter")
```

### Starts with

```
$startsWith($.pub.values.title, "Introduction")
```

### Ends with

```
$endsWith($.pub.values.filename, ".pdf")
```

## Case-insensitive matching

Wrap the path in `$lowercase()` or `$uppercase()`.

### Case-insensitive contains

```
$contains($lowercase($.pub.values.title), "snap")
```

### Case-insensitive equality

```
$lowercase($.pub.values.status) = "draft"
```

## Existence check

```
$exists($.pub.values.optionalField)
```

## Full-text search

Searches across all pub values using PostgreSQL full-text search.

```
$search("climate change")
```

## Relations

### Outgoing relations

Find pubs that have outgoing relations via a field.

```
$.pub.out.contributors
```

### Outgoing relations with filter

Filter by the relation value.

```
$.pub.out.contributors[$.value = "Editor"]
```

Filter by the related pub's field.

```
$.pub.out.contributors[$.relatedPub.values.institution = "MIT"]
```

Filter by the related pub's type.

```
$.pub.out.contributors[$.relatedPub.pubType.name = "Author"]
```

Combined filters.

```
$.pub.out.contributors[$.value = "Editor" and $contains($.relatedPub.values.name, "Smith")]
```

### Incoming relations

Find pubs that are referenced by other pubs via a field.

```
$.pub.in.chapters
```

Filter by the source pub.

```
$.pub.in.chapters[$.relatedPub.values.title = "The Big Book"]
```

## Interpolation (resolver only)

At the moment only used when configuring automations.

Use `{{ }}` to interpolate values from the context when using as a resolver.

```
$.pub.values.externalId = {{ $.json.body.articleId }}
```

The expression inside `{{ }}` is evaluated against the automation context before the query runs.

## Limits

Maximum relation depth: 3 levels.

## Unsupported

Variable assignment, lambda functions, recursive descent, and other advanced JSONata features are not supported.
