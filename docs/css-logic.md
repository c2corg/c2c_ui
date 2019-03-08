The CSS framework used on c2c_ui is bulma : https://bulma.io/

It comes with an exhaustive documentation : https://bulma.io/documentation/

Here is the logic you must follow :

* does bulma have a corresponding class for what you need? If yes, you must use it.
  * you can customize this class by modifying bulma variables : https://bulma.io/documentation/customize/variables/ . This modification must be placed on `/src/assets/sass/variables.scss`
* if bulma does not provide the class you need, but this class will be widely used, then you can add it in `/src/assets/sass/helpers.scss`
  * please follow bulma naming logic
  * but as Bulma provides a large set of class, it must stay an excpetion.
* then, if your calss belongs to your componenent, and only to your componenent
  * add it in `<style>`part
  * always use `scoped`style
  * do not hesitate to import variables and use them
