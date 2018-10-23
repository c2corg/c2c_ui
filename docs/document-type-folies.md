You may have noticed the usage of `documentType` property everywhere. Wait, but why ?

C2C api has two small anti patterns :

## Anti-pattern #1 : Document identifier is not only id (even it's unique) but id/type

`document_id` is an unique document identifier. But you have to know it's document type in order to request it. document types are like `route`, `outing`. Let's call this typology *explicit universe*. And you'll have to know your document type in *explicit universe* before asking something to API.

    https://api.camptocamp.org/outings/1053242

It could have been, without any collision issue

    https://www.camptocamp.org/documents/1053242

As now, only history service does not ask document's type :

    https://www.camptocamp.org/document/1053242/history/fr

## Anti-pattern #2 : Document type universes.

Well, to be frank, anti-pattern #1 is not a big issue. All C2C URLs must includes document type :

   https://www.camptocamp.org/outings/1053242/fr/presles-chrysanthemes-la-grotte     

And it's now part of data coherence. It could have been a little bit simpler to keep these value in URL as a simple label to make thing sexier. But well, definitly not a big deal.

Furthermore, you get response from API with this kind of data :

```JSON
{
    "document_id":1053242,    
    "type":"some document type. Spoiler alert : shit happens here"
}
```  

And that's quite cool, because, once you got your data, when it's time to make some actions with document_id/type, you have everything you need in your data structure, and you do not have to embed it into a request/response wrapper.

You may write component, by passing `document` property, or `id/type` properties to refer to a document, that's perfect.

But, there is always a but.

## The issue

`type` property universe is **NOT** in *explicit universe*, but `r`, `o`... :'(

So, you'll have to deal in any component to both use case.

## The solution

In vue-camptocamp, any component that require `document` property use `requireDocumentProperty` mixin, and this mixin add a computed property that expose `documentType` value, in  *explicit universe*.

Any component that explicitly use a type, is in `route`, `outing` universe, and use `requireDocumentTypeProperty` mixin. This prop is called `documentType` (`document-type` in kebab-case).

So, in any component that refers to a given document, you will have `this.documentType` property in the *explicit universe*.

And you shall always call a property that belongs to *explicit universe* **documentType**.

If you wan't to use `r`, `o`... universe, please call your property **type**, to stay coherant with API data model.
