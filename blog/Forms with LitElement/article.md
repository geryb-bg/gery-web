# Forms with LitElement and Redux

My team and I have been working on a project using the [PWA Starter Kit](https://pwa-starter-kit.polymer-project.org/) since the beginning of this year. I've learned so much in this project, how to create performant web components, how to embrace Redux (instead of fighting it) and how to secure the whole application using Azure Active Directory, just to name a few. Although we did get stuck a number of times on a few different things (which I plan to write about in the future), nothing stumped me more than building a form with validation. I think this was because I was thinking along the lines of _"But it's just a form, we build forms on the web every other day"_. By the end of this task, I went to my team, and with a big smile on my face said _"I Reduxed the hell out of that form"_.

In this post I'd like to share with you what I did to get our form to work the way we wanted it. The end goal is to be able to create or update an object named **Quest** which consists of one or more **Missions**. Our object structure will look something like this:

```
--------------------                ----------------------
| QUEST            |                | MISSION            |
--------------------                ----------------------
| Name      STRING |                | Name        STRING |
--------------------                | Description STRING |
                                    ----------------------
```

# The First Mission

The first component will be an HTML form that creates a mission object for us, it will have a property to store errors and it will not allow you to submit the form if there are errors on the page. The code for this looks as follows:

```js
import { LitElement, html } from 'lit-element';

export class MissionsForm extends LitElement {
  constructor() {
    super();
    this.errors = [];
  }

  static get properties() {
    return {
      errors: Array
    };
  }

  render() {
    const hasError = (name) => (this.errors.indexOf(name) >= 0 ? 'error' : '');

    return html`
      <style>
        .error {
          border: 1px solid red;
        }
      </style>

      <form @submit="${(e) => this.submit(e)}">
        <div>
          <label>Name: </label>
          <input class="${hasError('name')}" type="input" name="name"/>
        </div>
        <div>
          <label>
            Description:
          </label>
          <textarea class="${hasError('description')}" type="input" name="description">
          </textarea>
        </div>
        <div>
          <button type="button" @click="${() => this.cancel()}">Cancel</button>
          <button type="submit" class="save">Save</button>
        </div>
      </form>
    `;
  }

  submit(e) {
    e.preventDefault();
    let form = e.target;
    this.errors = this.checkForErrors(form);

    if (!this.errors.length) {
      let mission = {
        name: form.name.value,
        description: form.description.value
      };

      //save your mission here
      form.reset();
    }
  }

  checkForErrors(form) {
    let errors = [];

    if (!form.name.value) {
      errors.push('name');
    }

    if (!form.description.value) {
      errors.push('description');
    }

    return errors;
  }

  cancel() {
    form.reset();
  }
}

customElements.define('missions-form', MissionsForm);
```

This works fine, because every time we trigger the submit, if there are any errors, we update the property which causes the page to re-render and show us those errors. However, it's not great that the only time the errors will disappear is if the user clicks submit again. We want them to know that the error is fixed as soon as they have fixed it. In order to do that we must make a change to the html:

```html
<form @submit="${(e) => this.submit(e)}" @change="${(e) => this.formValueUpdated(e)}"></form>
```

We are now also listening to the change event on the form, this way we can remove the errors as soon as they are fixed by implementing the method:

```js
formValueUpdated(e) {
  let errorList = [...this.errors];
  if (!e.target.value) {
    errorList.push(e.target.name);
  } else {
    let indexOfError = errorList.indexOf(e.target.name);
    if (indexOfError >= 0) {
    errorList.splice(indexOfError, 1);
    }
  }
  this.errors = [...errorList];
}
```

## Adding Missions

What we need to do next is implement the `//save your mission here` method. In order to do that we will first make a new component, this new component will have our list of missions and it will also contain our form component. The basic outline will look like this:

```js
import { LitElement, html } from 'lit-element';

import './missions-form.component';

export class MissionsList extends LitElement {
  constructor() {
    super();
    this.missions = [];
  }

  static get properties() {
    return {
      missions: Array
    };
  }

  render() {
    return html`
      <ul>
        ${this.missions.map(
          (m) =>
            html`
              <li><strong>${m.name}:</strong> ${m.description}</li>
            `
        )}
      </ul>
      <missions-form></missions-form>
    `;
  }
}

customElements.define('missions-list', MissionsList);
```

We are going to use Redux to update our list of missions whenever save is clicked in the form component. If you are using the PWA Starter Kit, then you already have all of the Redux plumbing set up for you. If not, you can follow [this tutorial](https://vaadin.com/tutorials/lit-element/state-management-with-redux) to help you set it up. The following is the first version of our reducer:

```js
import { MISSIONS_UPDATED } from "../actions/missions-updated.action";

const INITIAL_STATE = {
    missions: []
};

export const editor = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case MISSIONS_UPDATED:
            return {
                ...state,
                missions: action.missions
            }
        default:
            return state;
    }
}
```

This reducer imports an action, let's implement that action:

```js
export const MISSIONS_UPDATED = 'MISSIONS_UPDATED';

export const missionsUpdated = (missions) => {
  return {
    type: MISSIONS_UPDATED,
    missions
  };
};
```

Now, whenever save is clicked we will need to dispatch that action, but in order to be able to do this we need to connect both of our components to the redux store. This means that we will need to change our `MissionsList` component to look like this:

```js
export class MissionsList extends connect(store)(LitElement) {
  //...
}
```

And our `MissionsForm` component will look like this:

```js
export class MissionsForm extends connect(store)(LitElement) {
  //...
}
```

Both of these components need to implement the `stateChanged` method, like this:

```js
stateChanged(state) {
  this.missions = state.missions;
}
```

> Here we are accessing the missions directly from the state. In my project we use `reselect` as a middleware to create optimized selectors. This has given us quite a nice performance boost. To see some of the things we did to improve our performance and make our code more readable, checkout my colleague's article on [Wrangling Redux](https://mikerambl.es/article/wrangling-redux-reducer-size).

The last thing left to do is to replace that comment with a call to our action and update the list of missions:

```js
store.dispatch(missionsUpdated([...this.missions, mission]));
```