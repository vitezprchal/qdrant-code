import "./globals.css"

export const metadata = {
	title: "Personal Task Manager",
	description: "A simple and efficient task management application",
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body className="bg-gray-50">{children}</body>
		</html>
	)
}
