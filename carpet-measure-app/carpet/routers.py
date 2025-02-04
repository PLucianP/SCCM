class CarpetDatabaseRouter:
    """
    Router to control all database operations on models in the carpet washing service.
    """
    route_app_labels = {
        'carpet', 
        'authentication',
        'admin',
        'auth',
        'contenttypes',
        'sessions'
    }

    def db_for_read(self, model, **hints):
        """
        Attempts to read models go to default db.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'default'
        return None

    def db_for_write(self, model, **hints):
        """
        Attempts to write models go to default db.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'default'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in our apps is involved.
        """
        if (
            obj1._meta.app_label in self.route_app_labels or
            obj2._meta.app_label in self.route_app_labels
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure migrations only run on the appropriate database.
        """
        if db == 'default':
            # Allow migrations for our apps on default
            return app_label in self.route_app_labels
        # Prevent migrations for our apps on other databases
        return app_label not in self.route_app_labels
