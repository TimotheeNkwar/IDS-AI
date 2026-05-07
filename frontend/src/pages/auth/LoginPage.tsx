import LoginForm from "../../components/auth/LoginForm";
export default function LoginPage() {
  return (
    <div className="h-screen  flex items-center justify-center">
      <div className="rounded-lg shadow-lg">
        <LoginForm />
      </div>
    </div>
  );
}

// function LoginText() {
//   return (
//     <div className=" w-2/3">
//       <div className="logo flex items-center justify-center gap-2 text-gray-200">
//         <h1 className="text-xs rounded-full flex justify-center items-center border-3 border-gray-300 w-12 h-12  font-bold">
//           IDS-AI
//         </h1>
//         <p className="text-xs">Your AI-Powered Solutions</p>
//       </div>
//       <h1 className="text-4xl font-sem mb-4 text-white">
//         Welcome Back to IDS-AI!
//       </h1>
//       <p className=" text-gray-300 text-base mb-8">
//         Please login to your account
//       </p>
//     </div>
//   );
// }
{
  /* <div className="grid grid-cols-2 pt-4 h-full ">
  <div
    className="bg-cover bg-center h-screen flex items-center justify-center text-center rounded-t-4xl"
    style={{
      backgroundImage: `url(${bgImage})`,
    }}
  >
    <LoginText />
  </div>
  <div className="bg-black h-screen">
    <LoginForm />
  </div>
</div>; */
}
