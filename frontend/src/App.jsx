import { SignIn } from '@clerk/clerk-react';
function App() {

  return (
  <div>
    <h1 className="h-screen hero">
      <SignIn />
    </h1>
  </div>
  )
}

export default App;
