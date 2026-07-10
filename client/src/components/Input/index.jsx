export default function Input({label,...props}){return <div className="field">{label&&<label>{label}</label>}<input className="input" {...props}/></div>}
