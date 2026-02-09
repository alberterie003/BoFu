export default function SettingsPage() {
    return (
        <div className="max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">General Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">Update your agency profile and branding.</p>
                    <div className="p-4 bg-secondary/50 rounded-lg border border-border text-sm text-muted-foreground">
                        Settings are coming soon in the next update.
                    </div>
                </div>
            </div>
        </div>
    )
}
