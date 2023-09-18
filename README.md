<a href="https://cheqii.myronng.com/">
    <img src="https://cheqii.myronng.com/static/logo-color.svg" alt="Cheqii logo" title="Cheqii" align="right" height="60" />
</a>

# Cheqii
Cheqii is a realtime collaborative payment splitter. Checks can be created to keep track of payments and allocate costs among contributors within a check. As contributors are added and items are entered into the check with a cost allocation, a summary of payments will be generated. The summary acts as a suggestion to minimize the number of payment transfers for each owing contributor. Registered users can link their account to a contributor to display a payment account that can be used to receive payments.

Every check has full user management that can be controlled by owners of the check. Owners can determine whether checks are freely accessible by any user with the check's link, or if users can only join by invitation as an editor or as a viewer. Viewers cannot edit a check but are able to view the summary and link their payment account to a contributor.

# Technical Details
Cheqii is built with Next.js and fully written in TypeScript. Basic internationalization functionality was added to display the application in different locales, however only English (en-CA) is currently supported.

## Authentication
Backed by Firebase, Cheqii allows multiple authentication sources including anonymous users, email based authentication, and third party authentication providers. All authentication types have access to complete workflows with some limitations to anonymous users. Registered users are able to manage their profiles along with additional preferences that are tied to their account. Anonymous users are able to upgrade to registered users by registering or signing in to an existing account. The anonymous user's checks will be merged into the registered user and maintain the highest permissions between the two accounts. 

## Backend
The backend uses Next.js to handle API requests and Firebase as the data source. Most of the user's actions involve interacting with Firebase directly so the backend API routes are minimal. They are primarily used in instances where a user is making changes to a resource that they aren't the owner of (e.g. removing a user from a check), where there are stricter validations coded in Firestore security rules. 

## Frontend
The frontend uses React and MUI components + icons for most basic views. More complex views will employ custom components that are styled with CSS via Emotion. The custom components uses CSS3 that is compatible with all evergreen browser with all vendor prefixes handled by the Babel equivalent in Next.js (SWC). The main check grid is fully memoized to demonstrate how to deal with performance issues with large controlled forms by preventing re-rendering of all child components when a state is changed. Cheqii does not use a state management library and instead uses React's built in context API.

## PWA
Cheqii uses next-pwa to deliver a full progressive web application experience. The application can be installed with PWA-enabled browsers and uses optimized caching strategies based on the type of resource being requested. Offline access is minimally supported in that checks can be viewed but are not editable as long as they have been cached beforehand. 

## Vercel 
The project is hosted on Vercel and utilizes the built in CI/CD with GitHub to manage multiple environments. Each environment is linked to a branch in the repository with each deploy instance having their own URL. When a pull request is merged to a designated environment branch, the deploy process is run to build the application and assign the domain to the new instance.
