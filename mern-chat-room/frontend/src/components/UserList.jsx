export default function UserList({ users, currentUser }) {
  return (
    <div className="p-3 h-100">
      <span className="eyebrow">In this room</span>
      <h2 className="h5 mb-3">Online ({users.length}/10)</h2>
      <ul className="list-group list-group-flush">
        {users.map((user) => (
          <li
            className="list-group-item px-0 bg-transparent text-light border-secondary"
            key={user}
          >
            <span className="online-dot" />
            {user}
            {user === currentUser && (
              <small className="text-secondary ms-1">(you)</small>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
