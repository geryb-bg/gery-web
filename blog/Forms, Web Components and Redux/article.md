# Forms, Web Components and Redux

My team and I have been working on a project using the [PWA Starter Kit](https://pwa-starter-kit.polymer-project.org/) since the beginning of this year. I've learned so much on this project, how to create performant web components, how to embrace Redux (instead of fighting it) and how to secure the whole application using Azure Active Directory, just to name a few. Although we did get stuck a number of times on a few different things (which we plan to write about in the future), nothing stumped me more than building a form with validation. I think this was because I was thinking along the lines of _"But it's just a form, we build forms on the web every other day"_. By the end of this task, I went to my team, and with a big smile on my face said _"I Reduxed the hell out of that form"_.

In this post I'd like to share with you what I did to get our form to work the way we wanted it.

The end goal is to be able to create or update an object named **Quest** which consists of one or more **Missions**. Our object structure will look something like this:

```
Quest {
  goal: string
}

Mission {
  name: string,
  description: string
}
```

# The first mission

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
          <textarea class="${hasError('description')}" name="description"></textarea>
        </div>
        <div>
          <button type="submit">Save</button>
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

      //save mission here
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
}

customElements.define('missions-form', MissionsForm);
```

This works fine, because every time we trigger the submit, if there are any errors, we update the property which causes the page to re-render and show us those errors. However, it's not great that the only time the errors will disappear is if the user clicks submit again. We want them to know that the error is fixed as soon as they have fixed it. In order to do that we must listen to the change event on the form:

```html
<form @submit="${(e) => this.submit(e)}" @change="${(e) => this.formValueUpdated(e)}">
  <!--...-->
</form>
```

We can now remove the errors as soon as they are fixed by implementing the method:

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

## Adding more missions

What we need to do next is implement the `//save mission here` method. In order to do that we will first make a new component, this new component will have our list of missions and it will also contain our form component. The basic outline will look like this:

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
      <h2>Missions</h2>
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

We are going to use Redux to update our list of missions whenever save is clicked in the form component. If you are using the PWA Starter Kit, then you already have all of the Redux plumbing set up for you. If you started from scratch, follow [this tutorial](https://vaadin.com/tutorials/lit-element/state-management-with-redux) to help you set it up. The following is the first version of our reducer:

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

Now, whenever save is clicked we will need to dispatch that action, but in order to be able to do this we need to connect both of our components to the redux store. This means that we will need to change our `MissionsList` component to connect it to the Redux store:

```js
export class MissionsList extends connect(store)(LitElement) {
  //...
}
```

And our `MissionsForm` component will also need to be connected:

```js
export class MissionsForm extends connect(store)(LitElement) {
  //...
}
```

Both of these components need to implement the `stateChanged` method:

```js
stateChanged(state) {
  this.missions = state.missions;
}
```

> Here we are accessing the missions directly from the state. In my project we use `reselect`, which is a middleware for creating optimised selectors. To see some of the things we did to improve our performance and make our code less complex, checkout my colleague's article on [Wrangling Redux](https://mikerambl.es/article/wrangling-redux-reducer-size).

The last thing left to do is to replace that comment with a call to our action and update the list of missions:

```js
store.dispatch(missionsUpdated([...this.missions, mission]));
```

# Quest

Our next component will be in charge of gathering information about the quest. In our example the quest only has one property, however, the code is written in such a way that this can be extended. Let's create a `QuestEditor` component:

```js
import { LitElement, html } from 'lit-element';
import { connect } from 'pwa-helpers';
import { store } from '../store';
import { questUpdated } from '../actions/quest-updated.action';
import { errorsDetected } from '../actions/errors-detected.action';

export class QuestEditor extends connect(store)(LitElement) {
  constructor() {
    super();
    this.errors = [];
  }

  static get properties() {
    return {
      quest: Object,
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

      <form @change="${(e) => this.formValueUpdated(e)}" @submit="${(e) => e.preventDefault()}">
        <div>
          <label>Goal:</label>
          <input class="${hasError('goal')}" name="goal" type="text" />
        </div>
      </form>
    `;
  }

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

    let quest = {
      ...this.quest,
      [e.target.name]: e.target.value
    };

    store.dispatch(errorsDetected(errorList));
    store.dispatch(questUpdated(quest));
  }

  stateChanged(state) {
    this.quest = state.quest;
    this.errors = state.errors;

    if (!this.quest) {
      this.quest = {
        goal: ''
      };
    }
  }
}

customElements.define('quest-editor', QuestEditor);
```

This component is very similar to the one we created for missions, the big difference is that this component does not have a save button. This is because we want to save the quest and missions at the same time (which we will do in another component in a moment). The `QuestEditor` component also has two new actions `errorsDetected` and `questUpdated`. We can implement them as follows:

```js
export const ERRORS_DETECTED = 'ERRORS_DETECTED';

export const errorsDetected = (errors) => {
  return {
    type: ERRORS_DETECTED,
    errors
  };
};
```

and

```js
export const QUEST_UPDATED = 'QUEST_UPDATED';

export const questUpdated = (quest) => {
  return {
    type: QUEST_UPDATED,
    quest
  };
};
```

We also need to update our reducer to cater for these two actions, first we change our `INITIAL_STATE` to:

```js
const INITIAL_STATE = {
  quest: {},
  missions: [],
  errors: []
};
```

Then add two more cases to our switch statement:

```js
case QUEST_UPDATED:
  return {
    ...state,
    quest: action.quest
  }
case ERRORS_DETECTED:
  return {
    ...state,
    errors: action.errors
  }
```

## Putting it all together

We have to combine what we have done in one "_main_" component, this component will be called `Quest` and will look as follows:

```js
import { LitElement, html } from 'lit-element';
import { connect } from 'pwa-helpers';
import { store } from '../store';
import { errorsDetected } from '../actions/errors-detected.action';

import './quest-editor.component';
import './missions-list.component';

export class Quest extends connect(store)(LitElement) {
  render() {
    return html`
      <h1>Create Quest</h1>
      <quest-editor></quest-editor>
      <missions-list></missions-list>
      <div>
        <button type="button" @click="${() => this.saveQuest()}">Save</button>
      </div>
    `;
  }

  saveQuest() {
    let errors = this.pageValid();
    if (!errors.length) {
      //save quest and missions here
    }
    store.dispatch(errorsDetected(errors));
  }

  pageValid() {
    let errors = [];

    if (!this.quest.goal) {
      errors.push('goal');
    }

    if (!this.missions.length) {
      errors.push('missions');
    }

    return errors;
  }

  stateChanged(state) {
    this.missions = state.missions;
    this.quest = state.quest;
  }
}

customElements.define('my-quest', Quest);
```

The `Quest` component is in charge of saving the things we have filled in. It needs to know about both the quest and the missions. However, you may have noticed that this component does not have any of its own properties, this is because we do not need to re-render it when quest, missions or errors change. We also need to make sure we have filled in all of the details correctly, the `pageValid` method is doing that for us. Lastly, if there are no errors, we can save everything (`//save quest and missions here`).

## Some cleaning up

We are almost done, there are a few more small things we have to handle. Let's start by displaying the `missions` error in the `MissionsList` component. To do that we need to:

1. Add errors as a property:
  ```js
  static get properties() {
    return {
      missions: Array,
      errors: Array
    };
  }
  ```
2. Initialise it to an empty array in the constructor:
  ```js
  constructor() {
    super();
    this.missions = [];
    this.errors = [];
  }
  ```
3. Set it in the `stateChanged` method:
  ```js
  stateChanged(state) {
    this.missions = state.missions;
    this.errors = state.errors;
  }
  ```
4. Create a new method to render our error message:
  ```js
  hasError() {
    return this.errors.indexOf('missions') >= 0
      ? html`
          <div class="error">There must be at least one mission in every quest!</div>
        `
      : html``;
  }
  ```
5. Call that method inside our render method:
  ```js
  render() {
    return html`
      <style>
        .error {
          color: red;
        }
      </style>

      <h2>Missions</h2>
      ${this.hasError()}
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
  ```

The last thing we have to do is some cleaning up in our `MissionsForm` component so that it follows the same pattern as the others. To do this we need to change:

1. The `stateChanged` to get the errors from state:
  ```js
  stateChanged(state) {
    this.missions = state.missions;
    this.errors = state.errors;
  }
  ```
2. The `formValueUpdated` method to dispatch an action instead of changing the property directly:
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
    store.dispatch(errorsDetected(errorList));
  }
  ```
3. And the `submit` method to do the same:
  ```js
  submit(e) {
    e.preventDefault();
    let form = e.target;
    let errors = this.checkForErrors(form);

    if (!errors.length) {
      let mission = {
        name: form.name.value,
        description: form.description.value
      };

      store.dispatch(missionsUpdated([...this.missions, mission]));
      form.reset();
    }

    store.dispatch(errorsDetected(errors))
  }
  ```

## Summary

That's all we need to get our forms working with LitElement and Redux. From here on it is possible to implement any other CRUD operations. You can take a look at the full example on [my GitHub repo](https://github.com/geryb-bg/lit-forms). The example will be updated with editing and deleting missions as well as editing quest.