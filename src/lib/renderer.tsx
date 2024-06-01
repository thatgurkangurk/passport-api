import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        {import.meta.env.PROD ? (
          <>
            <link href="/static/style.css" rel="stylesheet" />
          </>
        ) : (
          <>
            <link href="/src/style.css" rel="stylesheet" />
          </>
        )}
        <title>gurkz Passport</title>
      </head>
      <body class="min-h-screen w-full bg-gray-800 text-white p-2">
        {children}
      </body>
    </html>
  );
});
