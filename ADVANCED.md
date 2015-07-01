Advanced helper use
===================

### Extensive example for use of mode="paired" and the provide helper

This example deals with the case where you want both the key and the value of a content map. For example, suppose you want to create a select dropdown for all the states and have a value of the state code on each option tag.

Your `.properties` might look like:

```
stateList[AL]=Alabama
stateList[AK]=Alaska
stateList[AZ]=Arizona
stateList[AR]=Arkansas
...
```

With this, you have a viable representation that supports using the state code for the value in the option tag and the state name as the displayed value. To get the content into the template, you need to use the `@message` tag. `@message` inlines the content which, by itself, would create a problem for turning the above into a select list. To pull off the solution, you need two things: the `mode="paired"` parameter on the `@message` tag and to use the [`@provide` custom helper][@provide]

`mode="paired"` causes the `@message` tag to output the map as a JSON array with paired `$id`/`$elt` values.

Writing `{@message type="content" key="stateList" mode="paired" /}` results in

```
[{"$id":"AL","$elt":"Alabama"},{"$id":"AK","$elt":"Alaska"},... ]
```

Now we have this JSON inlined in our template. To make the data available to template code, we need to make it accessible to dust as if it was in the data model or passed as a parameter.

`@provide` processes each dust named block (such as `{:stateList}` in our case) creating a parameter bearing the name of the block and holding a value formed by a `JSON.parse` of the body of the block. The result of this, in our example, is equivalent to putting a parameter named stateList with value of a JSON array holding all the state data into the context where dust can reference it. Note that you can only use the name within the main block of provide -- the template area right after `@provide` up to the first named block.

It is not as complex as it sounds. Look at this code snippet that constructs a
select dropdown of the states and marks one of them selected (assuming the
value "chosen" is in the data model).

```
{@provide selected=chosen}
  <select name="states">
    {#stateList}
      <option value="{$id}" {@eq key="{selected}" value='{$id}'"} selected="selected" {/eq}>
        {$elt}
      </option>
    {/stateList}
  </select>
{:stateList}
  {@message type="content" key="stateList" mode="paired" /}
{/provide}
 ```

Since `@provide` is just another helper, it can take ordinary parameters so in this example, the code expects a value named "selected" and we have something named "chosen" so we use the normal dust parameter mechanism to "pass it".


